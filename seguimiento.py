import urllib.request, csv, json, io
from datetime import datetime, timedelta

def generate_seguimiento_detallado():
    # URL del dataset 2026 (Seguimiento de Proyectos de Inversión)
    url = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2026-Seguimiento-PI.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        print("🚀 Descargando base de datos completa del MEF (CSV)...")
        req = urllib.request.Request(url, headers=headers)
        
        # Aumentamos el timeout porque el archivo CSV es pesado
        with urllib.request.urlopen(req, timeout=600) as response:
            content = response.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            
            # Limpiar espacios en los nombres de las columnas
            reader.fieldnames = [f.strip() for f in reader.fieldnames]
            
            proyectos_data = []

            print("🔍 Filtrando inversiones para Lambayeque...")
            for r in reader:
                # FILTRO: Solo Lambayeque (ya sea por departamento o pliego)
                pliego = str(r.get('PLIEGO_NOMBRE', '')).upper()
                dpto_meta = str(r.get('DEPARTAMENTO_META_NOMBRE', '')).upper()
                
                if "LAMBAYEQUE" in pliego or "LAMBAYEQUE" in dpto_meta:
                    try:
                        pim = float(r.get('MONTO_PIM', 0) or 0)
                        dev = float(r.get('MONTO_DEVENGADO', 0) or 0)
                        
                        # Guardamos la estructura que el HTML espera
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

            # Guardar el archivo para el Dashboard de Seguimiento
            with open('data_proyectos.json', 'w', encoding='utf-8') as f:
                json.dump(proyectos_data, f, indent=2, ensure_ascii=False)
            
            print(f"✅ ¡Éxito! Se procesaron {len(proyectos_data)} registros para Lambayeque.")

    except Exception as e:
        print(f"🚨 Error en seguimiento.py: {e}")

if __name__ == "__main__":
    generate_seguimiento_detallado()
