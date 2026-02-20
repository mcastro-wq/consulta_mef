import urllib.request
import csv
import json
import io

def update_data():
    url_directa = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2025-Seguimiento-PI.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        print("📥 Descargando data completa del MEF...")
        req = urllib.request.Request(url_directa, headers=headers)
        
        with urllib.request.urlopen(req, timeout=300) as response:
            content = response.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            
            processed = []
            print("🔍 Filtrando Lambayeque por Año de Ejecución...")
            
            for r in reader:
                # Filtro por Departamento 14 y Sector GORE
                if str(r.get('DEPARTAMENTO_EJECUTORA')) == '14' and r.get('SECTOR_NOMBRE') == 'GOBIERNOS REGIONALES':
                    try:
                        pim = float(r.get('MONTO_PIM', 0) or 0)
                        dev = float(r.get('MONTO_DEVENGADO_ANO_EJE', 0) or 0)
                        
                        processed.append({
                            "NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                            "anio": r.get('ANO_EJE'), # CAPTURAMOS EL AÑO DEL DICCIONARIO
                            "pim": pim,
                            "devengado": dev,
                            "avance": round((dev / pim * 100), 1) if pim > 0 else 0
                        })
                    except:
                        continue

            if processed:
                with open('data_mef.json', 'w', encoding='utf-8') as f:
                    json.dump(processed, f, indent=2, ensure_ascii=False)
                print(f"✅ Sincronizados {len(processed)} registros multianuales.")

    except Exception as e:
        print(f"🚨 Error: {e}")
        exit(1)

if __name__ == "__main__":
    update_data()
