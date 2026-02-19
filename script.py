import requests
import json
import urllib.parse

# 1. Codificamos la consulta SQL para que los espacios y comillas no den error en la URL
sql_query = 'SELECT "DEPARTAMENTO_NOMBRE", SUM("EJECUCION") as total FROM "49d960a8-54cf-4a45-8ebe-d8074ac88877" GROUP BY "DEPARTAMENTO_NOMBRE"'
encoded_sql = urllib.parse.quote(sql_query)
url = f"https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search_sql?sql={encoded_sql}"

def update_data():
    try:
        response = requests.get(url, timeout=30)
        # CORRECCIÓN: Era 'status_code', no 'status_status'
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                records = data['result']['records']
                # Guardamos con ensure_ascii=False para que se vean bien las tildes (ej. Áncash)
                with open('data_mef.json', 'w', encoding='utf-8') as f:
                    json.dump(records, f, ensure_ascii=False, indent=2)
                print(f"Éxito: Se extrajeron {len(records)} registros.")
            else:
                print("Error en la respuesta de la API del MEF.")
        else:
            print(f"Error de conexión: Código {response.status_code}")
    except Exception as e:
        print(f"Ocurrió un error inesperado: {e}")

if __name__ == "__main__":
    update_data()
