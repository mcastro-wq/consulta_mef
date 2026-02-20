import urllib.request
import json
import time

def update_data():
    resource_id = "749cb9b6-604f-485b-bb06-4b906b44034f"
    # Pedimos los datos de forma plana, sin filtros SQL ni búsquedas 'q'
    # Solo limitamos a 500 registros para que el servidor responda rápido
    url = f"https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search?resource_id={resource_id}&limit=500"
    
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    for intento in range(3):
        try:
            print(f"🚀 Intento {intento+1}: Descargando bloque de datos...")
            req = urllib.request.Request(url, headers=headers)
            # Aumentamos el tiempo de espera a 60 segundos por la lentitud del MEF
            with urllib.request.urlopen(req, timeout=60) as response:
                res_data = json.loads(response.read().decode())
                records = res_data.get('result', {}).get('records', [])
                
                # Filtramos nosotros mismos en Python para no estresar al servidor
                processed = []
                for r in records:
                    if r.get('DEPARTAMENTO_EJECUTORA_NOMBRE') == 'LAMBAYEQUE':
                        pim = float(r.get('MONTO_PIM', 0) or 0)
                        dev = float(r.get('MONTO_DEVENGADO_ANO_EJE', 0) or 0)
                        processed.append({
                            "NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'S/N'),
                            "DEPARTAMENTO": "LAMBAYEQUE",
                            "pim": pim,
                            "devengado": dev,
                            "avance": round((dev / pim * 100), 1) if pim > 0 else 0
                        })

                if processed:
                    with open('data_mef.json', 'w', encoding='utf-8') as f:
                        json.dump(processed, f, indent=2, ensure_ascii=False)
                    print(f"✅ ¡Logrado! {len(processed)} proyectos guardados.")
                    return
                else:
                    print("⚠️ Datos descargados, pero Lambayeque no estaba en los primeros 500. Reintentando...")
                    # Si no está Lambayeque, subimos el límite para el próximo intento
                    url = f"https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search?resource_id={resource_id}&limit=1500"

        except Exception as e:
            print(f"❌ Error: {e}. Esperando para reintentar...")
            time.sleep(10)
    
    exit(1)

if __name__ == "__main__":
    update_data()
