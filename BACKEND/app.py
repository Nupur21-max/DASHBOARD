from flask import Flask,  jsonify, request,make_response
import requests
from dotenv import load_dotenv


import os


load_dotenv()

app = Flask(__name__)

@app.route('/get_data/<report_date>', methods=['GET'])
def get_data(report_date):
    supabase_url = os.getenv('supabase_url')
    data={"report_date": report_date}
    headers={
        "content-type": "application/json",
        "apikey":os.getenv('apikey')

    }
    response = requests.post(supabase_url, json=data, headers=headers)

    final_response=make_response(jsonify(response.json()))

    final_response.headers["Access-Control-Allow-Origin"]=os.getenv('allowed_origin')


    
    return final_response

    return jsonify(data)
if __name__ == '__main__':
    app.run(debug=True)
