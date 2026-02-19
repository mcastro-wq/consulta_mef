import requests
import json
import urllib.parse


resource_id = "49d960a8-54cf-4a45-8ebe-d8074ac88877"


sql_query = f'''
SELECT 
    "DEPARTAMENTO_META_NOMBRE", 
    SUM("MONTO_DEVENGADO_ANO_EJE") as total 
FROM "{resource_id}" 
GROUP BY "DEPARTAMENTO_META_NOMBRE"
'''

encoded_sql = urllib.parse.quote(sql_query)
url = f"https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search_sql?sql={encoded_sql}"

def update_data():
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
    }
    
    try:
        print("Iniciando extracción desde el MEF...")
        response = requests.get(url, headers=headers, timeout=60)
        
        if response.status_code == 200:
            res_json = response.json()
            if res_json.get('success'):
                records = res_json['result']['records']
                
                if records:
                    with open('data_mef.json', 'w', encoding='utf-8') as f:
                        json.dump(records, f, ensure_ascii=False, indent=2)
                    print(f"✅ ¡Logrado! Se guardaron {len(records)} departamentos en data_mef.json")
                else:
                    print("⚠️ La API no devolvió registros. Verifica si el resource_id es para el año actual.")
            else:
                print(f"❌ Error en Query: {res_json.get('error')}")
        else:
            print(f"❌ Error de Conexión HTTP: {response.status_code}")

    except Exception as e:
        print(f"⚠️ Error: {e}")

if __name__ == "__main__":
    update_data()

