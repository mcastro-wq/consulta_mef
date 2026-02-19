import urllib.request
import urllib.parse
import json

def update_data():
    resource_id = "749cb9b6-604f-485b-bb06-4b906b44034f"
    
    # Tu consulta SQL verificada (ajustada para traer datos con presupuesto real)
    sql = f"""
    SELECT * FROM "{resource_id}" 
    WHERE "SECTOR_NOMBRE" LIKE 'GOBIERNOS REGIONALES' 
    AND "MONTO_PIM" > 0 
    LIMIT 500
    """
    
    # Codificamos la URL correctamente
    params = urllib.parse.urlencode({'sql': sql})
    url = f"https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search_sql?{params}"
    
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as response:
            res_data = json.loads(response.read().decode())
            
            # En datastore_search_sql, los datos vienen en la raíz 'records' o dentro de 'result'
            records = res_data.get('records') or res_data.get('result', {}).get('records', [])
            
            if not records:
                print("⚠️ No se obtuvieron registros.")
                return

            processed = []
            for r in records:
                pim = float(r.get('MONTO_PIM', 0) or 0)
                dev = float(r.get('MONTO_DEVENGADO_ANO_EJE', 0) or 0)
                
                processed.append({
                    "NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                    "DEPARTAMENTO": r.get('DEPARTAMENTO_META_NOMBRE', 'OTROS'),
                    "pim": pim,
                    "devengado": dev,
                    "avance": round((dev / pim * 100), 1) if pim > 0 else 0
                })

            with open('data_mef.json', 'w', encoding='utf-8') as f:
                json.dump(processed, f, indent=2, ensure_ascii=False)
            
            print(f"✅ ¡Hecho! {len(processed)} proyectos guardados.")

    except Exception as e:
        print(f"🚨 Error crítico: {e}")

if __name__ == "__main__":
    update_data()
