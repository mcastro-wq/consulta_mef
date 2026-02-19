import requests
import json
import time

resource_id = '749cb9b6-604f-485b-bb06-4b906b44034f'
limit = 200  # Bloques más pequeños para que el MEF no se sature
max_intentos = 3 # Reintentos por cada bloque

def update_data():
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    all_records = []
    # Vamos a intentar traer los primeros 2000 registros en bloques de 200
    for offset in range(0, 2000, limit):
        exito_bloque = False
        for intento in range(max_intentos):
            try:
                url = f'https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search?resource_id={resource_id}&limit={limit}&offset={offset}'
                print(f"Descargando bloque {offset} (Intento {intento+1})...")
                
                response = requests.get(url, headers=headers, timeout=45)
                
                if response.status_code == 200:
                    records = response.json().get('result', {}).get('records', [])
                    if not records: break
                    
                    for r in records:
                        pim = float(r.get('MONTO_PIM', 0) or 0)
                        dev = float(r.get('MONTO_DEVENGADO_ANO_EJE', 0) or 0)
                        all_records.append({
                            "NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                            "DEPARTAMENTO": r.get('DEPARTAMENTO_META_NOMBRE', 'OTROS'),
                            "pim": pim,
                            "devengado": dev,
                            "avance": round((dev / pim * 100), 1) if pim > 0 else 0
                        })
                    exito_bloque = True
                    print(f"✅ Bloque {offset} guardado.")
                    break # Salir del bucle de reintentos
                else:
                    print(f"❌ Error {response.status_code} en bloque {offset}")
            
            except Exception as e:
                print(f"⚠️ Error de conexión en bloque {offset}: {e}")
                time.sleep(5) # Esperar antes de reintentar
        
        if not exito_bloque:
            print(f"⏩ Saltando bloque {offset} tras varios fallos.")

    if len(all_records) > 0:
        with open('data_mef.json', 'w', encoding='utf-8') as f:
            json.dump(all_records, f, indent=2, ensure_ascii=False)
        print(f"🚀 FINALIZADO: Se obtuvieron {len(all_records)} proyectos.")
    else:
        print("🚨 No se pudo obtener nada. Manteniendo datos previos.")

if __name__ == "__main__":
    update_data()
