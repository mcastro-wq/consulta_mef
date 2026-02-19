import requests
import json
import time

resource_id = '749cb9b6-604f-485b-bb06-4b906b44034f'
# Tamaño de cada bolsa de datos (500 es ideal para que no falle)
limit = 500 

def update_data():
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    all_records = []
    offset = 0 # Empezamos desde el registro 0
    total_a_traer = 3000 # Ajusta este número según cuántos proyectos quieras ver

    try:
        print(f"Iniciando descarga masiva de datos (Meta: {total_a_traer} registros)...")
        
        while offset < total_a_traer:
            # Construimos la URL con el offset (página actual)
            url = f'https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search?resource_id={resource_id}&limit={limit}&offset={offset}'
            
            response = requests.get(url, headers=headers, timeout=60)
            
            if response.status_code == 200:
                data = response.json()
                records = data.get('result', {}).get('records', [])
                
                if not records: # Si ya no hay más datos, paramos
                    break
                
                for r in records:
                    pim = float(r.get('MONTO_PIM', 0) or 0)
                    dev = float(r.get('MONTO_DEVENGADO_ANO_EJE', 0) or 0)
                    
                    all_records.append({
                        "NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'PROYECTO SIN NOMBRE'),
                        "DEPARTAMENTO": r.get('DEPARTAMENTO_META_NOMBRE', 'OTROS'),
                        "pim": pim,
                        "devengado": dev,
                        "avance": round((dev / pim * 100), 1) if pim > 0 else 0
                    })
                
                print(f"✅ Descargados: {len(all_records)} registros...")
                offset += limit # Saltamos a la siguiente página
                time.sleep(1) # Pausa breve para no saturar al MEF
            else:
                print(f"⚠️ Error en página {offset}. Código: {response.status_code}")
                break

        if all_records:
            with open('data_mef.json', 'w', encoding='utf-8') as f:
                json.dump(all_records, f, indent=2, ensure_ascii=False)
            print(f"🚀 PROCESO COMPLETADO: {len(all_records)} proyectos guardados.")
            return

    except Exception as e:
        print(f"🚨 Fallo de conexión: {e}")

    # Si todo falla, mantenemos el respaldo para que la web no muera
    print("Utilizando datos de respaldo por fallo crítico.")
    backup = [{"NOMBRE": "ERROR DE CONEXIÓN MEF", "DEPARTAMENTO": "SISTEMA", "pim": 0, "dev": 0, "avance": 0}]
    with open('data_mef.json', 'w', encoding='utf-8') as f:
        json.dump(backup, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    update_data()
