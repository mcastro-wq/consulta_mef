import urllib.request, csv, json, io
from datetime import datetime, timedelta

def generate_seguimiento_detallado():
    # URL del dataset 2026
    url = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2026-Seguimiento-PI.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        print("🚀 Descargando base de datos completa del MEF (CSV)...")
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req, timeout=600) as response:
            content = response.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            reader.fieldnames = [f.strip() for f in reader.fieldnames]
            
            proyectos_data = []

            print("🔍 Filtrando inversiones para Lambayeque...")
            for r in reader:
                pliego = str(r.get('PLIEGO_NOMBRE', '')).upper()
                dpto_meta = str(r.get('DEPARTAMENTO_META_NOMBRE', '')).upper()
                
                if "LAMBAYEQUE" in pliego or "LAMBAYEQUE" in dpto_meta:
                    try:
                        pim = float(r.get('MONTO_PIM', 0) or 0)
                        dev = float(r.get('MONTO_DEVENGADO', 0) or 0)
                        
                        proyectos_data.append({
                            "PRODUCTO_PROYECTO": r.get('PRODUCTO_PROYECTO', '0'),
                            "PRODUCTO_PROYECTO_NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                            "EJECUTORA_NOMBRE": r.get('EJECUTORA_NOMBRE', 'SIN EJECUTORA'),
                            "CATEGORIA_GASTO_NOMBRE": r.get('CATEGORIA_GASTO_NOMBRE', 'INVERSION'),
                            "MES_EJE": r.get('MES_EJE', '1'),
                            "MONTO_PIM": pim,
                            "MONTO_DEVENGADO": dev
                        })
                    except ValueError:
                        continue

            # --- LÓGICA DE FECHA DE EXTRACCIÓN ---
            hora_peru = datetime.now() - timedelta(hours=5)
            fecha_texto = hora_peru.strftime("%d/%m/%Y %H:%M")

            # Estructura final con el sello de tiempo
            objeto_final = {
                "fecha_extraccion": fecha_texto,
                "proyectos": proyectos_data
            }

            # Guardar el archivo
            with open('data_proyectos.json', 'w', encoding='utf-8') as f:
                json.dump(objeto_final, f, indent=2, ensure_ascii=False)
            
            print(f"✅ ¡Éxito! Sincronizado el {fecha_texto}")
            print(f"📂 Se procesaron {len(proyectos_data)} registros.")

    except Exception as e:
        print(f"🚨 Error en seguimiento.py: {e}")

if __name__ == "__main__":
    generate_seguimiento_detallado()
