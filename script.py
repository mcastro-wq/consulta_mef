import requests
import json

# Consulta SQL para traer solo lo acumulado por departamento
sql_query = 'SELECT "DEPARTAMENTO_NOMBRE", SUM("EJECUCION") as total FROM "49d960a8-54cf-4a45-8ebe-d8074ac88877" GROUP BY "DEPARTAMENTO_NOMBRE"'
url = f"https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search_sql?sql={sql_query}"

def update_data():
    response = requests.get(url)
    if response.status_status == 200:
        data = response.json()['result']['records']
        with open('data_mef.json', 'w') as f:
            json.dump(data, f)

update_data()
