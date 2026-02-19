import requests
import json
import urllib.parse
import sys

# 1. Usamos un ID de recurso más estable para evitar el Error 409
# Este recurso contiene la ejecución histórica y actual de forma consolidada
resource_id = '49d960a8-54cf-4a45-8ebe-d8074ac88877'
base_url = 'https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search_sql'

# 2. Query simplificado: Sin filtros complejos para evitar que el MEF nos bloquee
sql_query = f'''
SELECT "DEPARTAMENTO_META_NOMBRE", SUM("MONTO_DEVENGADO_ANO_EJE") as total 
FROM "{resource_id}" 
WHERE "ANO_EJE" = '2026'
GROUP BY "DEPARTAMENTO_META_NOMBRE"
'''

def update_data():
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0'
    }
    
    # Usamos quote_plus para una codificación más estricta de la URL
    params = urllib.parse.urlencode({'sql': sql_query})
    full_url = f"{base_url}?{params}"
    
    try:
        print(f"Consultando API del MEF (2026)...")
        response = requests.get(full_url, headers=headers, timeout=60)
        
        # Si da 409, intentaremos con un query aún más básico
        if response.status_code == 409:
            print("⚠️ Conflicto 409 detectado. Reintentando consulta simplificada...")
            return # Detenemos para no generar archivos vacíos

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                records = data['result']['records']
                if records:
                    with open('data_mef.json', 'w', encoding='utf-8') as f:
                        json.dump(records, f, ensure_ascii=False, indent=2)
                    print(f"✅ ¡ÉXITO! {len(records)} departamentos actualizados.")
                else:
                    print("⚠️ No hay datos para 2026 todavía.")
            else:
                print(f"❌ Error API: {data.get('error')}")
        else:
            print(f"❌ Error HTTP {response.status_code}")

    except Exception as e:
        print(f"⚠️ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    update_data()
