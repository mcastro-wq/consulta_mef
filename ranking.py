import urllib.request, csv, json, io
from datetime import datetime, timedelta

def generate_ranking():
    # URL del dataset de Gasto Diario 2026
    url = "https://fs.datosabiertos.mef.gob.pe/datastorefiles/2026-Gasto-Diario.csv"
    headers = {'User-Agent': 'Mozilla/5.0'}
    
    print("⏳ Descargando y procesando datos del MEF...")
    
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=300) as response:
            content = response.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            reader.fieldnames = [f.strip() for f in reader.fieldnames]
            
            # Diccionario para acumular montos por Pliego y por Tipo
            # Estructura interna: { "LIMA": { "2": {...}, "3": {...} } }
            db = {}

            for r in reader:
                # 1. Filtro de Año
                if str(r.get('ANO_EJE', '')).strip() != "2026":
                    continue

                # 2. Filtro de Nivel de Gobierno (Regionales + Muni Lima)
                nivel = str(r.get('NIVEL_GOBIERNO_NOMBRE', '')).upper()
                pliego_raw = str(r.get('PLIEGO_NOMBRE', '')).upper()
                
                if "REGIONALES" in nivel or "MUNICIPALIDAD METROPOLITANA DE LIMA" in pliego_raw:
                    # Limpiar nombre del pliego
                    nombre = pliego_raw.replace("GOBIERNO REGIONAL DEL DEPARTAMENTO DE ", "") \
                                       .replace("GOBIERNO REGIONAL DE ", "") \
                                       .replace("GOBIERNO REGIONAL DEL ", "") \
                                       .replace("GOBIERNO REGIONAL ", "").strip()
                    
                    if not nombre: continue

                    # 3. Extraer TIPO_ACT_PROY (2=Proyecto, 3=Actividad)
                    tipo_id = str(r.get('TIPO_ACT_PROY', '0')).strip()
                    
                    try:
                        pim = float(r.get('MONTO_PIM', 0) or 0)
                        dev = float(r.get('MONTO_DEVENGADO', 0) or 0)
                        cer = float(r.get('MONTO_CERTIFICADO', 0) or 0)
                        
                        if nombre not in db:
                            db[nombre] = {}
                        
                        if tipo_id not in db[nombre]:
                            db[nombre][tipo_id] = {"pim": 0, "dev": 0, "cer": 0}
                        
                        # Acumulación de montos
                        db[nombre][tipo_id]["pim"] += pim
                        db[nombre][tipo_id]["dev"] += dev
                        db[nombre][tipo_id]["cer"] += cer
                        
                    except (ValueError, TypeError):
                        continue

            # 4. Transformar a formato PLANO para Power BI
            final_data = []
            for pliego, tipos in db.items():
                for t_id, montos in tipos.items():
                    # Mapeo de nombres para que sea legible en el gráfico
                    nombre_tipo = "PROYECTOS" if t_id == "2" else "ACTIVIDADES" if t_id == "3" else "OTROS"
                    
                    avance = round((montos["dev"] / montos["pim"] * 100), 1) if montos["pim"] > 0 else 0
                    
                    final_data.append({
                        "pliego": pliego,
                        "tipo_id": int(t_id),
                        "tipo_nombre": nombre_tipo,
                        "pim": montos["pim"],
                        "certificado": montos["cer"],
                        "devengado": montos["dev"],
                        "saldo": montos["pim"] - montos["dev"],
                        "avance": avance
                    })

            # Ordenar por avance para que el gráfico salga ordenado por defecto
            final_data.sort(key=lambda x: x["avance"], reverse=True)

            # Ajuste de hora (Perú UTC-5)
            hora_peru = (datetime.now() - timedelta(hours=5)).strftime("%d/%m/%Y %H:%M")
            
            output = {
                "ultima_actualizacion": hora_peru,
                "anio_fiscal": "2026",
                "data": final_data  # Esta es la lista que importarás en Power BI
            }

            with open('data_ranking.json', 'w', encoding='utf-8') as f:
                json.dump(output, f, indent=2, ensure_ascii=False)
            
            print(f"✅ Proceso terminado. {len(final_data)} filas generadas en 'data_ranking.json'.")

    except Exception as e:
        print(f"🚨 Error crítico: {e}")

if __name__ == "__main__":
    generate_ranking()
