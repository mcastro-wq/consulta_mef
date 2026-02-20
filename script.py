import urllib.request
import json

def update_data():
    # Usamos el método de búsqueda simple (q=LAMBAYEQUE) que no da Error 500
    resource_id = "749cb9b6-604f-485b-bb06-4b906b44034f"
    url = f"https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search?resource_id={resource_id}&q=LAMBAYEQUE&limit=100"
    
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = json.loads(response.read().decode())
            # En este método, los datos están en result -> records
            records = res_data.get('result', {}).get('records', [])
            
            processed = []
            for r in records:
                # Filtro manual para asegurar que solo sea Lambayeque (por si la búsqueda 'q' trae otros)
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

            with open('data_mef.json', 'w', encoding='utf-8') as f:
                json.dump(processed, f, indent=2, ensure_ascii=False)
            
            print(f"✅ ¡Por fin! {len(processed)} proyectos guardados sin errores SQL.")

    except Exception as e:
        print(f"🚨 Error: {e}")
        exit(1)

if __name__ == "__main__":
    update_data()
