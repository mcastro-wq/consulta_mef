import requests
import json
import os

def obtener_datos_mef():
    # URL de la API de Datos Abiertos del MEF
    API_URL = "https://api.datosabiertos.mef.gob.pe/DatosAbiertos/v1/datastore_search_sql"
    
    # ID del recurso para el año 2026 (según tu diccionario)
    RESOURCE_ID = "615644aa-ef73-4358-b4e0-0c20931632f3"
    
    # Consulta SQL para traer lo necesario para el seguimiento de Lambayeque
    # Filtramos por PLIEGO_NOMBRE y agrupamos para no saturar el JSON
    query = f"""
    SELECT 
        "PRODUCTO_PROYECTO", 
        "PRODUCTO_PROYECTO_NOMBRE", 
        "EJECUTORA_NOMBRE", 
        "CATEGORIA_GASTO_NOMBRE",
        "MES_EJE",
        SUM("MONTO_PIM") as "MONTO_PIM", 
        SUM("MONTO_DEVENGADO") as "MONTO_DEVENGADO"
    FROM "{RESOURCE_ID}" 
    WHERE "PLIEGO_NOMBRE" LIKE '%LAMBAYEQUE%'
    GROUP BY 
        "PRODUCTO_PROYECTO", 
        "PRODUCTO_PROYECTO_NOMBRE", 
        "EJECUTORA_NOMBRE", 
        "CATEGORIA_GASTO_NOMBRE",
        "MES_EJE"
    ORDER BY "MONTO_PIM" DESC
    """

    params = {'sql': query}

    print("🚀 Conectando con la API del MEF...")
    
    try:
        response = requests.get(API_URL, params=params)
        response.raise_for_status() # Lanza error si la respuesta no es 200
        
        data = response.json()
        
        if data['success']:
            resultados = data['result']['records']
            
            # Guardar en archivo JSON
            nombre_archivo = 'data_proyectos.json'
            with open(nombre_archivo, 'w', encoding='utf-8') as f:
                json.dump(resultados, f, ensure_ascii=False, indent=4)
            
            print(f"✅ ¡Éxito! Se han descargado {len(resultados)} registros.")
            print(f"📂 Archivo guardado como: {nombre_archivo}")
        else:
            print("❌ Error en la consulta: La API respondió success: false")

    except requests.exceptions.RequestException as e:
        print(f"❌ Error de conexión: {e}")

if __name__ == "__main__":
    obtener_datos_mef()
