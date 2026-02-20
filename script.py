import urllib.request
import json
import time

def update_data():
    resource_id = "749cb9b6-604f-485b-bb06-4b906b44034f"
    # Consultamos de la forma más sencilla posible para evitar Error 500
    # Pedimos un bloque de datos sin filtros SQL pesados
    url = f"https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search?resource_id={resource_id}&limit=1000"
    
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    for intento in range(3):
        try:
            print(f"📡 Intento {intento+1}: Descargando datos del MEF...")
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=45) as response:
                res_data = json.loads(response.read().decode())
                records = res_data.get('result', {}).get('records', [])
                
                # Procesamos localmente (Mucho más rápido y seguro)
                processed = []
                for r in records:
                    # Filtramos por el código 14 o el nombre LAMBAYEQUE
                    # Usamos r.get para que no falle si falta la columna
                    depto_id = str(r.get('DEPARTAMENTO_EJECUTORA', ''))
                    depto_nom = str(r.get('DEPARTAMENTO_EJECUTORA_NOMBRE', ''))
                    
                    if depto_id == '14' or 'LAMBAYEQUE' in depto_nom.upper():
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
                    print(f"✅ ¡Éxito! {len(processed)} proyectos de Lambayeque procesados.")
                    return
                else:
                    print("⚠️ No se encontró Lambayeque en este bloque. Ampliando búsqueda...")
                    url = f"https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search?resource_id={resource_id}&limit=5000"

        except Exception as e:
            print(f"❌ Intento fallido: {e}. Reintentando en 10s...")
            time.sleep(10)
    
    exit(1)

if __name__ == "__main__":
    update_data()
