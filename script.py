import requests
import json
import urllib.parse
import sys

# Cambiamos al endpoint de búsqueda simple que es menos propenso al Error 409
base_url = 'https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search'
resource_id = '49d960a8-54cf-4a45-8ebe-d8074ac88877'

def update_data():
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0'
    }
    
    # En lugar de SQL, pedimos los primeros 1000 registros para procesarlos localmente
    # Esto evita el motor SQL de la API que es el que está fallando
    params = {
        'resource_id': resource_id,
        'limit': 1000,
        'q': '2026' # Filtramos por el año 2026
    }
    
    query_string = urllib.parse.urlencode(params)
    full_url = f"{base_url}?{query_string}"
    
    try:
        print(f"Iniciando descarga de datos (Modo Simple)...")
        response = requests.get(full_url, headers=headers, timeout=60)
        
        if response.status_code == 200:
            data = response.json()
            records = data.get('result', {}).get('records', [])
            
            if records:
                # Procesamos los datos localmente para agrupar por departamento
                resumen = {}
                for r in records:
                    depto = r.get('DEPARTAMENTO_META_NOMBRE', 'OTROS')
                    monto = float(r.get('MONTO_DEVENGADO_ANO_EJE', 0))
                    resumen[depto] = resumen.get(depto, 0) + monto
                
                # Convertimos al formato que espera tu script.js
                final_data = [{"DEPARTAMENTO_META_NOMBRE": k, "total": v} for k, v in resumen.items()]
                
                with open('data_mef.json', 'w', encoding='utf-8') as f:
                    json.dump(final_data, f, ensure_ascii=False, indent=2)
                
                print(f"✅ Éxito: Se procesaron {len(final_data)} departamentos.")
            else:
                print("⚠️ No se encontraron registros para 2026.")
        else:
            print(f"❌ Error HTTP {response.status_code}: {response.text}")

    except Exception as e:
        print(f"⚠️ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    update_data()
