import urllib.request
import csv
import json
import io

def update_data():
    url_directa = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2025-Seguimiento-PI.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        print("📥 Descargando data del MEF...")
        req = urllib.request.Request(url_directa, headers=headers)
        
        with urllib.request.urlopen(req, timeout=300) as response:
            content = response.read().decode('utf-8-sig')
            f = io.StringIO(content)
            reader = csv.DictReader(f)
            reader.fieldnames = [field.strip() for field in reader.fieldnames]
            
            processed = []
            print("🛡️ Filtrando Lambayeque (14) y extrayendo Sectores...")
            
            for r in reader:
                # Filtro estricto por Departamento 14
                dpto_cod = str(r.get('DEPARTAMENTO_EJECUTORA', '')).strip()
                
                if dpto_cod == '14':
                    try:
                        pim = float(r.get('MONTO_PIM', 0) or 0)
                        dev = float(r.get('MONTO_DEVENGADO_ANO_EJE', 0) or 0)
                        
                        processed.append({
                            "NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                            "anio": r.get('ANO_EJE', '2025'),
                            "sector": r.get('SECTOR_NOMBRE', 'OTROS'), # Dato para el gráfico
                            "pim": pim,
                            "devengado": dev,
                            "avance": round((dev / pim * 100), 1) if pim > 0 else 0
                        })
                    except:
                        continue

            if processed:
                with open('data_mef.json', 'w', encoding='utf-8') as f:
                    json.dump(processed, f, indent=2, ensure_ascii=False)
                print(f"✅ Filtrado completado! {len(processed)} proyectos de Lambayeque con Sectores.")
            else:
                print("⚠️ No se encontró nada para el código 14.")

    except Exception as e:
        print(f"🚨 Error: {e}")
        exit(1)

if __name__ == "__main__":
    update_data()
