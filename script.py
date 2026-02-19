import urllib.request
import urllib.parse
import json
import os

# Configuracion del endpoint SQL
resource_id = "749cb9b6-604f-485b-bb06-4b906b44034f"
# SQL: Filtramos Gobiernos Regionales, Año 2025 y solo proyectos con presupuesto (PIM > 0)
sql_query = """
SELECT 
    "DEPARTAMENTO_META_NOMBRE", 
    "PRODUCTO_PROYECTO_NOMBRE", 
    "MONTO_PIM", 
    "MONTO_DEVENGADO_ANO_EJE" 
FROM "{0}" 
WHERE "SECTOR_NOMBRE" LIKE 'GOBIERNOS REGIONALES' 
AND "ANO_EJE" = '2025' 
AND "MONTO_PIM" > 0 
LIMIT 2000
""".format(resource_id)

def update_mef_data():
    try:
        params = urllib.parse.urlencode({'sql': sql_query})
        url = f"https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search_sql?{params}"
        
        headers = {'User-Agent': 'Mozilla/5.0'}
        req = urllib.request.Request(url, headers=headers)
        
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            
            # El SQL del MEF devuelve los datos en la llave 'records'
            if 'records' in data:
                raw_records = data['records']
                processed = []
                
                for r in raw_records:
                    pim = float(r.get('MONTO_PIM', 0) or 0)
                    dev = float(r.get('MONTO_DEVENGADO_ANO_EJE', 0) or 0)
                    
                    processed.append({
                        "DEPARTAMENTO": r.get('DEPARTAMENTO_META_NOMBRE', 'OTROS'),
                        "NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                        "pim": pim,
                        "devengado": dev,
                        "avance": round((dev / pim * 100), 1) if pim > 0 else 0
                    })
                
                # Guardamos el archivo para que lo use el index.html
                with open('data_mef.json', 'w', encoding='utf-8') as f:
                    json.dump(processed, f, indent=2, ensure_ascii=False)
                print(f"✅ Éxito: {len(processed)} proyectos guardados.")
            else:
                print("❌ No se encontraron registros.")
                
    except Exception as e:
        print(f"🚨 Error: {e}")

if __name__ == "__main__":
    update_mef_data()
