import urllib.request, csv, json, io
from datetime import datetime
from datetime import timedelta

def update_data():
    # Nota: Asegúrate de que la URL apunte al año correcto (2026) cuando el MEF la habilite
    url = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2025-Seguimiento-PI.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        print("📥 Descargando datos del MEF...")
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=300) as response:
            content = response.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            reader.fieldnames = [f.strip() for f in reader.fieldnames]
            
            processed = []
            for r in reader:
                # Filtro Lambayeque (14)
                if str(r.get('DEPARTAMENTO_EJECUTORA', '')).strip() == '14':
                    try:
                        pim = float(r.get('MONTO_PIM', 0) or 0)
                        dev = float(r.get('MONTO_DEVENGADO_ANO_EJE', 0) or 0)
                        
                        # --- NUEVA LÓGICA: EXTRACCIÓN DE CAMPOS PARA EL MONITOR ---
                        processed.append({
                            "cui": r.get('PRODUCTO_PROYECTO', '0'), # AQUÍ ESTÁ EL CUI
                            "NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                            "anio": r.get('ANO_EJE', '2026'),
                            "sector": r.get('EJECUTORA_NOMBRE', 'OTROS'), # Usamos nombre de ejecutora para el filtro
                            "pim": pim,
                            "certificado": float(r.get('MONTO_CERTIFICADO', 0) or 0),
                            "compromiso_anual": float(r.get('MONTO_COMPROMETIDO_ANUAL', 0) or 0),
                            "compromiso_mensual": float(r.get('MONTO_COMPROMETIDO_ANO_EJE', 0) or 0),
                            "devengado": dev,
                            "girado": float(r.get('MONTO_GIRADO_ANO_EJE', 0) or 0),
                            "avance": round((dev / pim * 100), 1) if pim > 0 else 0
                        })
                    except:
                        continue
            
            # --- ESTRUCTURA CON FECHA Y HORA ---
            hora_peru = datetime.now() - timedelta(hours=5)
            
            output = {
                "ultima_actualizacion": hora_peru.strftime("%d/%m/%Y %H:%M"),
                "proyectos": processed
            }
            
            with open('data_mef.json', 'w', encoding='utf-8') as f:
                json.dump(output, f, indent=2, ensure_ascii=False)
                
            print(f"✅ ¡Éxito! {len(processed)} proyectos procesados con CUI.")
            print(f"⏰ Actualización registrada: {output['ultima_actualizacion']}")
            
    except Exception as e:
        print(f"🚨 Error crítico: {e}")
        exit(1)

if __name__ == "__main__":
    update_data()
