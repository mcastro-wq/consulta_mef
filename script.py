import requests
import json
import sys

# Usamos el endpoint de búsqueda simple, no el de SQL para evitar el Error 409
resource_id = '749cb9b6-604f-485b-bb06-4b906b44034f'
url = f'https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search?resource_id={resource_id}&limit=5000'

def update_data():
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121.0.0.0 Safari/537.36'
    }
    
    try:
        print(f"Descargando datos crudos del MEF (Modo Estable)...")
        response = requests.get(url, headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            records = data.get('result', {}).get('records', [])
            
            if records:
                # PYTHON HACE EL TRABAJO: Agrupamos y sumamos aquí
                resumen = {}
                for r in records:
                    # Usamos el nombre de columna del diccionario
                    depto = r.get('DEPARTAMENTO_META_NOMBRE')
                    monto = r.get('MONTO_DEVENGADO_ANO_EJE')
                    
                    if depto and monto is not None:
                        try:
                            monto_float = float(monto)
                            resumen[depto] = resumen.get(depto, 0) + monto_float
                        except ValueError:
                            continue
                
                # Formateamos para el script.js
                final_data = [{"DEPARTAMENTO_META_NOMBRE": k, "total": v} for k, v in resumen.items()]
                
                # Ordenar por total para que el gráfico se vea bien
                final_data.sort(key=lambda x: x['total'], reverse=True)

                with open('data_mef.json', 'w', encoding='utf-8') as f:
                    json.dump(final_data, f, ensure_ascii=False, indent=2)
                
                print(f"✅ ¡ÉXITO! Se procesaron {len(final_data)} departamentos.")
            else:
                print("⚠️ No se encontraron registros.")
        else:
            print(f"❌ Error HTTP {response.status_code}: {response.text[:200]}")

    except Exception as e:
        print(f"⚠️ Error inesperado: {e}")
        sys.exit(1)

if __name__ == "__main__":
    update_data()
