import requests
import json
import urllib.parse
import sys

# Configuración
resource_id = '49d960a8-54cf-4a45-8ebe-d8074ac88877'
base_url = 'https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search_sql'

# QUERY DEFINITIVO: Nota el uso de comillas dobles para columnas
sql_query = f'''
SELECT "DEPARTAMENTO_META_NOMBRE", SUM("MONTO_DEVENGADO_ANO_EJE") as total 
FROM "{resource_id}" 
WHERE "DEPARTAMENTO_META_NOMBRE" IS NOT NULL 
GROUP BY "DEPARTAMENTO_META_NOMBRE"
'''

def update_data():
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0 Safari/537.36'
    }
    
    params = urllib.parse.urlencode({'sql': sql_query})
    full_url = f"{base_url}?{params}"
    
    try:
        print("Consultando API del MEF...")
        response = requests.get(full_url, headers=headers, timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                records = data['result']['records']
                
                if records:
                    with open('data_mef.json', 'w', encoding='utf-8') as f:
                        json.dump(records, f, ensure_ascii=False, indent=2)
                    print(f"✅ ¡ÉXITO! Se guardaron {len(records)} registros.")
                else:
                    # Si no hay datos, escribimos el error en el JSON para forzar el commit
                    error_msg = [{"error": "La consulta no devolvio datos", "status": "vacio"}]
                    with open('data_mef.json', 'w', encoding='utf-8') as f:
                        json.dump(error_msg, f)
                    print("⚠️ API respondió éxito pero sin registros.")
            else:
                print(f"❌ Error API: {data.get('error')}")
        else:
            print(f"❌ Error HTTP {response.status_code}")

    except Exception as e:
        print(f"⚠️ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    update_data()
