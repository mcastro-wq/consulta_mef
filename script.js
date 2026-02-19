import requests
import json
import urllib.parse

# 1. Configuración de la API según documentación
# Endpoint para consultas SQL
base_url = 'https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search_sql'
resource_id = '49d960a8-54cf-4a45-8ebe-d8074ac88877'

# 2. Construcción del Query SQL con los nombres exactos de tu Diccionario de Datos
# Nota: Los nombres de columnas con mayúsculas DEBEN ir en comillas dobles
sql_query = f'''
SELECT "DEPARTAMENTO_META_NOMBRE", SUM("MONTO_DEVENGADO_ANO_EJE") as total 
FROM "{resource_id}" 
GROUP BY "DEPARTAMENTO_META_NOMBRE"
'''

# Codificamos el query para la URL
params = {'sql': sql_query}
full_url = f"{base_url}?{urllib.parse.urlencode(params)}"

def update_data():
    # El User-Agent es vital para evitar el bloqueo 403 en GitHub Actions
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0 Safari/537.36'
    }
    
    try:
        print(f"Iniciando consulta al MEF...")
        response = requests.get(full_url, headers=headers, timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            
            # Según CKAN, si 'success' es True, los datos están en result['records']
            if data.get('success'):
                records = data['result']['records']
                
                if records:
                    with open('data_mef.json', 'w', encoding='utf-8') as f:
                        json.dump(records, f, ensure_ascii=False, indent=2)
                    print(f"✅ Éxito: Se guardaron {len(records)} registros en data_mef.json")
                else:
                    print("⚠️ La consulta no devolvió registros (vacío).")
            else:
                print(f"❌ Error devuelto por la API: {data.get('error')}")
        else:
            print(f"❌ Error de conexión: Código {response.status_code}")
            print(f"Detalle: {response.text[:200]}")

    except Exception as e:
        print(f"⚠️ Ocurrió un error inesperado: {e}")

if __name__ == "__main__":
    update_data()
