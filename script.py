import requests
import json
import sys

# 1. Configuración usando el endpoint estable
resource_id = '749cb9b6-604f-485b-bb06-4b906b44034f'
url = 'https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search'

def update_data():
    # Parámetros igual al ejemplo de jQuery: recurso y límite
    params = {
        'resource_id': resource_id,
        'limit': 1000 # Traemos suficiente data para que el gráfico sea real
    }
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0'
    }

    try:
        print(f"Consultando API del MEF (2025)...")
        response = requests.get(url, params=params, headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            records = data.get('result', {}).get('records', [])
            
            if records:
                # Agrupamos los datos en Python (más seguro que SQL)
                resumen = {}
                for r in records:
                    # Usamos el nombre de columna del MEF
                    depto = r.get('DEPARTAMENTO_META_NOMBRE', 'OTROS')
                    monto = float(r.get('MONTO_DEVENGADO_ANO_EJE', 0))
                    resumen[depto] = resumen.get(depto, 0) + monto
                
                # Formateamos para script.js
                final_data = [{"DEPARTAMENTO_META_NOMBRE": k, "total": v} for k, v in resumen.items()]
                
                # Guardamos el archivo
                with open('data_mef.json', 'w', encoding='utf-8') as f:
                    json.dump(final_data, f, ensure_ascii=False, indent=2)
                
                print(f"✅ Éxito: Se procesaron {len(final_data)} departamentos.")
            else:
                print("⚠️ La API respondió pero no envió registros.")
        else:
            print(f"❌ Error del servidor MEF: Código {response.status_code}")

    except Exception as e:
        print(f"⚠️ Error de conexión: {e}")
        sys.exit(1)

if __name__ == "__main__":
    update_data()
