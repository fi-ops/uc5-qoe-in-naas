#!/usr/bin/python

#This script is used to join automatically two networks in different DevStack instances.
#Execute the script where XIFI network controller runs, otherwise change manually the controller IP address

import httplib
import json
controllerAddress='localhost'

class TopologyRequest(object):

    def __init__(self, server):
        self.server = server

    def get(self):
        ret = self.get_url('GET')
        return json.loads(ret[2])

    def join(self, data):
        ret = self.join_url(data, 'POST')
        return ret[0] == 200

    def get_url(self, action):
        path = "/print_topology"
        conn = httplib.HTTPConnection(self.server, 5002)
        conn.request(action, path)
        response = conn.getresponse()
        ret = (response.status, response.reason, response.read())
        print ret
        conn.close()
        return ret

    def join_url(self, data, action):
	    path = "/join_networks"
	    headers = {
	        'Content-type': 'application/json',
	        'Accept': 'application/json',
	        }
	    body = json.dumps(data)
	    conn = httplib.HTTPConnection(self.server, 5002)
	    conn.request(action, path, body, headers)
	    response = conn.getresponse()
	    ret = (response.status, response.reason, response.read())
	    print ret
	    conn.close()
	    return ret
data={}
topology=TopologyRequest(controllerAddress)
networks_id_json=topology.get();
i=1
for network in networks_id_json:
	id_net_name="net_id_%s" % (i)
	data[id_net_name]=network
	i+=1

topology.join(data)
