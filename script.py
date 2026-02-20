import urllib.request, csv, json, io

def update_data():
    url_directa = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2025-Seguimiento-PI.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    try:
        print("📥 Descargando data real del MEF...")
        req = urllib.request.Request(url_directa, headers=headers)
        
        with urllib.request.urlopen(req, timeout=300) as response:
            content = response.read().decode('utf-8-sig')
            f = io.StringIO(content)
            reader = csv.DictReader(f)
            reader.fieldnames = [field.strip() for field in reader.fieldnames]
            
            processed = []
            for r in reader:
                # Filtro por Lambayeque (14)
                if str(r.get('DEPARTAMENTO_EJECUTORA', '')).strip() == '14':
                    try:
                        pim = float(r.get('MONTO_PIM', 0) or 0)
                        dev = float(r.get('MONTO_DEVENGADO_ANO_EJE', 0) or 0)
                        
                        processed.append({
                            "NOMBRE": r.get('PRODUCTO_PROYECTO_NOMBRE', 'SIN NOMBRE'),
                            "anio": r.get('ANO_EJE', '2025'),
                            "sector": r.get('SECTOR_NOMBRE', 'OTROS'), # <--- ESTO FALTABA
                            "pim": pim,
                            "devengado": dev,
                            "avance": round((dev / pim * 100), 1) if pim > 0 else 0
                        })
                    except: continue

            if processed:
                with open('data_mef.json', 'w', encoding='utf-8') as f:
                    json.dump(processed, f, indent=2, ensure_ascii=False)
                print(f"✅ ¡Éxito! {len(processed)} proyectos de Lambayeque listos.")
    except Exception as e:
        print(f"🚨 Error: {e}")

if __name__ == "__main__":
    update_data()
