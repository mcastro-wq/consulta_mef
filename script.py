import urllib.request, csv, json, io
from datetime import datetime, timedelta

def update_data():
    # URL actualizada a 2026 (Asegúrate que el archivo exista en el MEF)
    url = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2026-Seguimiento-PI.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        print("📥 Descargando datos del MEF 2026...")
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=300) as response:
            content = response.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            
            # Limpiar espacios en los nombres de las columnas
            reader.fieldnames = [f.strip() for f in reader.fieldnames]
            
            processed = []
            for r in reader:
                # Filtro Lambayeque (14)
                if str(r.get('DEPARTAMENTO_EJECUTORA', '')).strip() == '14':
                    try:
                        # Extraemos todos los montos para que los Gauges del HTML funcionen
                        pim = float(r.get('MONTO_PIM', 0) or 0)
                        cert = float(r.get('MONTO_CERTIFICADO', 0) or 0)
                        anual = float(r.get('MONTO_COMPROMETIDO_ANUAL', 0) or 0)
                        mensual = float(r.get('MONTO_COMPROMETIDO', 0) or 0)
                        dev = float(r.get('MONTO_DEVENGADO', 0) or 0) # Nombre corregido según diccionario 2026
                        gir = float(r.get('MONTO_GIRADO', 0) or 0)

                        processed.append({
                            "cui": r.get('PRODUCTO_PROYECTO', '0'), # AQUÍ ESTÁ EL CÓDIGO DE PROYECTO
                            "NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                            "anio": r.get('ANO_EJE', '2026'),
                            "sector": r.get('EJECUTORA_NOMBRE', 'OTROS'),
                            "pim": pim,
                            "certificado": cert,
                            "compromiso_anual": anual,
                            "compromiso_mensual": mensual,
                            "devengado": dev,
                            "girado": gir,
                            "tipo": r.get('TIPO_ACT_PROY_NOMBRE', ''),
                            "tipo_cod": r.get('TIPO_ACT_PROY', '')
                        })
                    except Exception as e:
                        continue
            
            # Hora de Perú
            hora_peru = datetime.now() - timedelta(hours=5)
            
            output = {
                "ultima_actualizacion": hora_peru.strftime("%d/%m/%Y %H:%M"),
                "proyectos": processed
            }
            
            with open('data_mef.json', 'w', encoding='utf-8') as f:
                json.dump(output, f, indent=2, ensure_ascii=False)
                
            print(f"✅ ¡Éxito! {len(processed)} registros de Lambayeque procesados.")
            
    except Exception as e:
        print(f"🚨 Error crítico: {e}")

if __name__ == "__main__":
    update_data()
