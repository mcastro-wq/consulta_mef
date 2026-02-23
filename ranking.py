import urllib.request, csv, json, io
from datetime import datetime, timedelta

def generate_ranking():
    url = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2025-Seguimiento-PI.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        print("📥 Descargando datos para el Ranking Nacional...")
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=300) as response:
            content = response.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            
            # Limpiar nombres de columnas por si traen espacios
            reader.fieldnames = [f.strip() for f in reader.fieldnames]
            
            ranking_data = {}

            for r in reader:
                # Filtrar solo Gobiernos Regionales (Pliegos 441 al 463 aprox)
                pliego_nom = str(r.get('PLIEGO_NOMBRE', '')).upper()
                if "GOBIERNO REGIONAL" in pliego_nom:
                    pliego = pliego_nom.strip()
                    try:
                        # Extraer montos probando diferentes nombres de columna comunes en el MEF
                        pim = float(r.get('MONTO_PIM', 0) or 0)
                        
                        # El certificado a veces viene como MONTO_CERTIFICADO o MONTO_CERTIFICADO_ANO_EJE
                        cert = float(r.get('MONTO_CERTIFICADO_ANO_EJE', r.get('MONTO_CERTIFICADO', 0)) or 0)
                        
                        # El devengado igual
                        dev = float(r.get('MONTO_DEVENGADO_ANO_EJE', r.get('MONTO_DEVENGADO', 0)) or 0)
                        
                        if pliego not in ranking_data:
                            ranking_data[pliego] = {"pim": 0, "certificado": 0, "devengado": 0}
                        
                        ranking_data[pliego]["pim"] += pim
                        ranking_data[pliego]["certificado"] += cert
                        ranking_data[pliego]["devengado"] += dev
                    except:
                        continue

            final_list = []
            for pliego, montos in ranking_data.items():
                avance = (montos["devengado"] / montos["pim"] * 100) if montos["pim"] > 0 else 0
                # Saldo es PIM menos lo que ya se devengó
                saldo = montos["pim"] - montos["devengado"]
                
                final_list.append({
                    "pliego": pliego.replace("GOBIERNO REGIONAL DEL DEPARTAMENTO DE ", "").replace("GOBIERNO REGIONAL DE ", "").replace("GOBIERNO REGIONAL DEL ", ""),
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
            
            print(f"✅ Ranking generado con {len(final_list)} regiones.")

    except Exception as e:
        print(f"🚨 Error en ranking: {e}")

if __name__ == "__main__":
    generate_ranking()
