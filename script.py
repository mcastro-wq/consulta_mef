import urllib.request
import urllib.parse
import json
import time

def update_data():
    resource_id = "749cb9b6-604f-485b-bb06-4b906b44034f"
    
    # Consulta simplificada al máximo para evitar errores de servidor
    # Quitamos el LIKE y usamos '=' directo que es más rápido
    sql = (
        f'SELECT "PRODUCTO_PROYECTO_NOMBRE", "MONTO_PIM", "MONTO_DEVENGADO_ANO_EJE" '
        f'FROM "{resource_id}" '
        f'WHERE "DEPARTAMENTO_EJECUTORA_NOMBRE" = \'LAMBAYEQUE\' '
        f'AND "MONTO_PIM" > 0 '
        f'LIMIT 500'
    )
    
    params = urllib.parse.urlencode({'sql': sql})
    url = f"https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search_sql?{params}"
    
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    
    # Intentamos hasta 3 veces por si el servidor da 409 o 500
    for intento in range(3):
        try:
            print(f"🛰️ Intento {intento + 1}: Conectando con el MEF...")
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=30) as response:
                res_data = json.loads(response.read().decode())
                records = res_data.get('result', {}).get('records', [])
                
                if not records:
                    print("⚠️ No se encontraron registros.")
                    return

                processed = []
                for r in records:
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
                
                print(f"✅ ¡Éxito! {len(processed)} proyectos guardados.")
                return # Salimos del bucle si tuvo éxito

        except Exception as e:
            print(f"❌ Error en intento {intento + 1}: {e}")
            time.sleep(5) # Esperamos 5 segundos antes de reintentar
    
    exit(1) # Si después de 3 intentos falla, cerramos con error

if __name__ == "__main__":
    update_data()
