import urllib.request, csv, json, io
from datetime import datetime, timedelta

def generate_ranking():
    url = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2026-Seguimiento-PI.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=300) as response:
            content = response.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            # Limpiar espacios en los nombres de las columnas
            reader.fieldnames = [f.strip() for f in reader.fieldnames]
            
            ranking_data = {}

            for r in reader:
                # FILTRO DE AÑO: Solo registros del 2026
                ano_eje = str(r.get('ANO_EJE', '')).strip()
                if ano_eje != "2026":
                    continue

                # FILTRO ESTRICTO: Solo nivel Regional o la Municipalidad de Lima
                nivel = str(r.get('NIVEL_GOBIERNO_NOMBRE', '')).upper()
                pliego_raw = str(r.get('PLIEGO_NOMBRE', '')).upper()
                
                if "REGIONALES" in nivel or "MUNICIPALIDAD METROPOLITANA DE LIMA" in pliego_raw:
                    # Limpiar nombre para el ranking
                    nombre = pliego_raw.replace("GOBIERNO REGIONAL DEL DEPARTAMENTO DE ", "") \
                                       .replace("GOBIERNO REGIONAL DE ", "") \
                                       .replace("GOBIERNO REGIONAL DEL ", "") \
                                       .replace("GOBIERNO REGIONAL ", "").strip()
                    
                    if not nombre: continue

                    try:
                        pim = float(r.get('MONTO_PIM', 0) or 0)
                        dev = float(r.get('MONTO_DEVENGADO_ANO_EJE', 0) or 0)
                        
                        if nombre not in ranking_data:
                            ranking_data[nombre] = {"pim": 0, "devengado": 0}
                        
                        ranking_data[nombre]["pim"] += pim
                        ranking_data[nombre]["devengado"] += dev
                    except (ValueError, TypeError):
                        continue

            final_list = []
            for nombre, montos in ranking_data.items():
                if montos["pim"] > 0:
                    avance = (montos["devengado"] / montos["pim"] * 100)
                    final_list.append({
                        "pliego": nombre,
                        "pim": montos["pim"],
                        "devengado": montos["devengado"],
                        "saldo": montos["pim"] - montos["devengado"],
                        "avance": round(avance, 1)
                    })

            # Ordenar por avance de mayor a menor
            final_list.sort(key=lambda x: x["avance"], reverse=True)

            # Ajuste de hora (UTC-5 para Perú)
            hora_peru = datetime.now() - timedelta(hours=5)
            output = {
                "ultima_actualizacion": hora_peru.strftime("%d/%m/%Y %H:%M"),
                "anio_fiscal": "2026",
                "ranking": final_list
            }

            with open('data_ranking.json', 'w', encoding='utf-8') as f:
                json.dump(output, f, indent=2, ensure_ascii=False)
            
            print(f"✅ Ranking Regional 2026 generado con {len(final_list)} entidades.")

    except Exception as e:
        print(f"🚨 Error: {e}")

if __name__ == "__main__":
    generate_ranking()
