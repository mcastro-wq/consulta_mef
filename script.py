import requests
import json
import urllib.parse

# 1. Configuración de la consulta
# El ID del recurso es el dataset de ejecución presupuestal del MEF
resource_id = "49d960a8-54cf-4a45-8ebe-d8074ac88877"
sql_query = f'SELECT "DEPARTAMENTO_NOMBRE", SUM("EJECUCION") as total FROM "{resource_id}" GROUP BY "DEPARTAMENTO_NOMBRE"'
encoded_sql = urllib.parse.quote(sql_query)
url = f"https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search_sql?sql={encoded_sql}"

def update_data():
    # 2. Definimos Headers (User-Agent) para que el servidor del MEF no rechace la petición
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
    }
    
    try:
        print(f"Conectando a la API del MEF...")
        response = requests.get(url, headers=headers, timeout=60)
        
        # Verificamos si la respuesta fue exitosa (Código 200)
        if response.status_code == 200:
            data = response.json()
            
            if data.get('success'):
                records = data['result']['records']
                
                # Validamos que existan registros antes de escribir
                if len(records) > 0:
                    with open('data_mef.json', 'w', encoding='utf-8') as f:
                        json.dump(records, f, ensure_ascii=False, indent=2)
                    
                    print(f"✅ ¡Éxito! Se extrajeron {len(records)} registros y se guardaron en data_mef.json.")
                else:
                    print("⚠️ La consulta tuvo éxito pero devolvió 0 registros. Revisa el ID del recurso.")
            else:
                print(f"❌ Error en la lógica de la API: {data.get('error')}")
        
        elif response.status_code == 403:
            print("❌ Error 403: Acceso denegado. El MEF está bloqueando la petición de GitHub Actions.")
        else:
            print(f"❌ Error de conexión: Código {response.status_code}")
            print(f"Contenido del error: {response.text[:200]}")

    except requests.exceptions.Timeout:
        print("❌ Error: Tiempo de espera agotado (Timeout). El servidor del MEF está lento.")
    except Exception as e:
        print(f"⚠️ Ocurrió un error inesperado: {e}")

if __name__ == "__main__":
    update_data()
