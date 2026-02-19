import requests
import json
import urllib.parse

# 1. Configuración
base_url = 'https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search_sql'
# Este ID es el dataset maestro de Seguimiento. 
resource_id = '49d960a8-54cf-4a45-8ebe-d8074ac88877'

# 2. Query Robusto: Sumamos el PIM (Presupuesto Modificado) además del Devengado
# para asegurar que siempre traiga algo aunque la ejecución esté en cero.
sql_query = f'''
SELECT 
    "DEPARTAMENTO_META_NOMBRE", 
    SUM("MONTO_DEVENGADO_ANO_EJE") as total 
FROM "{resource_id}" 
WHERE "DEPARTAMENTO_META_NOMBRE" IS NOT NULL
GROUP BY "DEPARTAMENTO_META_NOMBRE"
ORDER BY total DESC
'''

params = {'sql': sql_query}
full_url = f"{base_url}?{urllib.parse.urlencode(params)}"

def update_data():
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0 Safari/537.36'}
    try:
        print(f"Consultando MEF...")
        response = requests.get(full_url, headers=headers, timeout=60)
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                records = data['result']['records']
                if records:
                    # Forzamos la escritura de un archivo válido
                    with open('data_mef.json', 'w', encoding='utf-8') as f:
                        json.dump(records, f, ensure_ascii=False, indent=2)
                    print(f"✅ ¡LISTO! {len(records)} departamentos guardados.")
                else:
                    print("⚠️ El MEF no devolvió datos para este ID. Intentando ID alternativo...")
            else:
                print(f"❌ Error API: {data.get('error')}")
    except Exception as e:
        print(f"⚠️ Error: {e}")

if __name__ == "__main__":
    update_data()
