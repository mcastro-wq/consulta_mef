import urllib.request, csv, json, io
from datetime import datetime, timedelta

def generate_seguimiento_detallado():
    # URL del dataset 2026 de Seguimiento Físico-Financiero
    url = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2026-Seguimiento-PI.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        print("🚀 Descargando base de datos completa del MEF para Lambayeque...")
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=600) as response:
            content = response.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            # Limpiar espacios en los nombres de las columnas
            reader.fieldnames = [f.strip() for f in reader.fieldnames]
            
            proyectos_data = []

            print("🔍 Extrayendo PIA, PIM, Certificación, Compromisos y Devengado...")
            for r in reader:
                # Filtrar específicamente por Lambayeque
                pliego = str(r.get('PLIEGO_NOMBRE', '')).upper()
                dpto_meta = str(r.get('DEPARTAMENTO_META_NOMBRE', '')).upper()
                
                if "LAMBAYEQUE" in pliego or "LAMBAYEQUE" in dpto_meta:
                    try:
                        # Conversión segura a float (si es vacío pone 0)
                        def to_f(val): return float(val or 0)

                        proyectos_data.append({
                            "PRODUCTO_PROYECTO": r.get('PRODUCTO_PROYECTO', '0'),
                            "PRODUCTO_PROYECTO_NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                            "EJECUTORA_NOMBRE": r.get('EJECUTORA_NOMBRE', 'SIN EJECUTORA'),
                            "PIA": to_f(r.get('MONTO_PIA')),
                            "MONTO_PIM": to_f(r.get('MONTO_PIM')),
                            "MONTO_CERTIFICADO": to_f(r.get('MONTO_CERTIFICADO')),
                            "COMPROMISO_ANUAL": to_f(r.get('MONTO_COMPROMETIDO_ANUAL')),
                            "COMPROMISO_MENSUAL": to_f(r.get('MONTO_COMPROMETIDO')),
                            "MONTO_DEVENGADO": to_f(r.get('MONTO_DEVENGADO')),
                            "MES_EJE": r.get('MES_EJE', '1')
                        })
                    except ValueError:
                        continue

            # --- LÓGICA DE FECHA DE EXTRACCIÓN ---
            hora_peru = datetime.now() - timedelta(hours=5)
            fecha_texto = hora_peru.strftime("%d/%m/%Y %H:%M")

            objeto_final = {
                "fecha_extraccion": fecha_texto,
                "proyectos": proyectos_data
            }

            # Guardar el archivo JSON
            with open('data_proyectos.json', 'w', encoding='utf-8') as f:
                json.dump(objeto_final, f, indent=2, ensure_ascii=False)
            
            print(f"✅ ¡Éxito! Sincronizado el {fecha_texto}")
            print(f"📂 Se procesaron {len(proyectos_data)} registros con datos completos.")

    except Exception as e:
        print(f"🚨 Error en seguimiento.py: {e}")

if __name__ == "__main__":
    generate_seguimiento_detallado()
