import urllib.request
import csv
import json
import io

def update_data():
    # URL de descarga directa que se ve en tu captura (CSV es más ligero para descargar)
    url_directa = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2025-Seguimiento-PI.csv"
    
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        print("📥 Iniciando descarga del archivo completo (esto puede tardar)...")
        req = urllib.request.Request(url_directa, headers=headers)
        
        with urllib.request.urlopen(req, timeout=300) as response:
            # Leemos el contenido como texto
            content = response.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            
            processed = []
            print("🔍 Filtrando datos de Lambayeque (Código 14)...")
            
            for r in reader:
                # Usamos el código 14 que identificaste correctamente
                if str(r.get('DEPARTAMENTO_EJECUTORA')) == '14' and r.get('SECTOR_NOMBRE') == 'GOBIERNOS REGIONALES':
                    try:
                        pim = float(r.get('MONTO_PIM', 0) or 0)
                        dev = float(r.get('MONTO_DEVENGADO_ANO_EJE', 0) or 0)
                        
                        processed.append({
                            "NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                            "DEPARTAMENTO": "LAMBAYEQUE",
                            "pim": pim,
                            "devengado": dev,
                            "avance": round((dev / pim * 100), 1) if pim > 0 else 0
                        })
                    except:
                        continue

            if processed:
                with open('data_mef.json', 'w', encoding='utf-8') as f:
                    json.dump(processed, f, indent=2, ensure_ascii=False)
                print(f"✅ ¡Éxito! Se procesaron {len(processed)} proyectos reales.")
            else:
                print("⚠️ No se encontraron datos para los filtros aplicados.")

    except Exception as e:
        print(f"🚨 Error crítico: {e}")
        exit(1)

if __name__ == "__main__":
    update_data()
