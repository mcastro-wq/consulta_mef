import urllib.request, csv, json, io
from datetime import datetime, timedelta

def generate_ranking():
    url = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2025-Seguimiento-PI.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=300) as response:
            content = response.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            
            # Limpiar nombres de columnas
            reader.fieldnames = [f.strip() for f in reader.fieldnames]
            cols = reader.fieldnames
            
            # Identificar dinámicamente las columnas (por si cambian de nombre)
            col_pim = next((c for c in cols if 'MONTO_PIM' in c), 'MONTO_PIM')
            col_cert = next((c for c in cols if 'CERTIFICADO' in c), 'MONTO_CERTIFICADO_ANO_EJE')
            col_dev = next((c for c in cols if 'DEVENGADO' in c), 'MONTO_DEVENGADO_ANO_EJE')
            
            ranking_data = {}

            for r in reader:
                pliego_raw = str(r.get('PLIEGO_NOMBRE', '')).upper()
                
                # Solo procesar si contiene GOBIERNO REGIONAL o es una región conocida
                if "GOBIERNO REGIONAL" in pliego_raw or r.get('DEPARTAMENTO_EJECUTORA') != '':
                    
                    # NORMALIZACIÓN: Limpiamos el nombre para evitar duplicados
                    nombre = pliego_raw.replace("GOBIERNO REGIONAL DEL DEPARTAMENTO DE ", "") \
                                       .replace("GOBIERNO REGIONAL DE ", "") \
                                       .replace("GOBIERNO REGIONAL DEL ", "") \
                                       .replace("GOBIERNO REGIONAL ", "").strip()
                    
                    if not nombre or nombre == "OTROS": continue

                    try:
                        pim = float(r.get(col_pim, 0) or 0)
                        cert = float(r.get(col_cert, 0) or 0)
                        dev = float(r.get(col_dev, 0) or 0)
                        
                        if nombre not in ranking_data:
                            ranking_data[nombre] = {"pim": 0, "certificado": 0, "devengado": 0}
                        
                        ranking_data[nombre]["pim"] += pim
                        ranking_data[nombre]["certificado"] += cert
                        ranking_data[nombre]["devengado"] += dev
                    except:
                        continue

            # Convertir a lista y filtrar registros basura (PIM > 0)
            final_list = []
            for nombre, montos in ranking_data.items():
                if montos["pim"] > 0: # <-- ESTO QUITA LAS FILAS CON CERO
                    avance = (montos["devengado"] / montos["pim"] * 100) if montos["pim"] > 0 else 0
                    saldo = montos["pim"] - montos["devengado"]
                    
                    final_list.append({
                        "pliego": nombre,
                        "pim": montos["pim"],
                        "certificado": montos["certificado"],
                        "devengado": montos["devengado"],
                        "saldo": saldo,
                        "avance": round(avance, 1)
                    })

            # Ordenar por avance de mayor a menor
            final_list.sort(key=lambda x: x["avance"], reverse=True)

            hora_peru = datetime.now() - timedelta(hours=5)
            output = {
                "ultima_actualizacion": hora_peru.strftime("%d/%m/%Y %H:%M"),
                "ranking": final_list
            }

            with open('data_ranking.json', 'w', encoding='utf-8') as f:
                json.dump(output, f, indent=2, ensure_ascii=False)
            
            print(f"✅ ¡Éxito! {len(final_list)} regiones procesadas sin duplicados.")

    except Exception as e:
        print(f"🚨 Error: {e}")

if __name__ == "__main__":
    generate_ranking()
