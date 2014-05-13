#!/usr/bin/python
#This script changes manually the flow path between two DevStack instances, joined by XIFI
#Network controller. It works only with one VM for Devstack instances!
#Execute the script where XIFI network controller runs, otherwise change manually the controller IP address

import httplib
import json

#Support Variables....

inter_island_port=1
instance_num=1
dhcp_data={}
vm_data={}
controllerAddress='localhost'

class TopologyRequest(object):

    def __init__(self, server):
        self.server = server

    def get(self):
        ret = self.get_url('GET')
        return json.loads(ret[2])

    def get_url(self, action):
        path = "/print_topology"
        conn = httplib.HTTPConnection(self.server, 5002)
        conn.request(action, path)
        response = conn.getresponse()
        ret = (response.status, response.reason, response.read())
        print ret
        conn.close()
        return ret

class StaticFlowPusher(object):

    def __init__(self, server):
        self.server = server

    def get(self, data):
        ret = self.get_url(data, 'GET')
        return json.loads(ret[2])

    def set(self, data):
        ret = self.rest_call(data, 'POST')
        return ret[0] == 200

    def remove(self, data):
        ret = self.rest_call(data, 'DELETE')
        return ret[0] == 200

    def clear(self):
        ret = self.delete_all_flows('GET')
        return ret[0] == 204

    def rest_call(self, data, action):
        path = '/wm/staticflowentrypusher/json'
        headers = {
            'Content-type': 'application/json',
            'Accept': 'application/json',
            }
        body = json.dumps(data)
        conn = httplib.HTTPConnection(self.server, 8080)
        conn.request(action, path, body, headers)
        response = conn.getresponse()
        ret = (response.status, response.reason, response.read())
        print ret
        conn.close()
        return ret

    def get_url(self, data, action):
        path = "/wm/staticflowentrypusher/list/%s/json" % (data['switch'])
        conn = httplib.HTTPConnection(self.server, 8080)
        conn.request(action, path)
        response = conn.getresponse()
        ret = (response.status, response.reason, response.read())
        print ret
        conn.close()
        return ret

    def delete_all_flows(self, action):
        path = "/wm/staticflowentrypusher/clear/all/json"
        conn = httplib.HTTPConnection(self.server, 8080)
        conn.request(action, path)
        response = conn.getresponse()
        ret = (response.status, response.reason, response.read())
        print ret
        conn.close()
        return ret



flow_broadcast_from_vm = {
    "priority":"1030",
    "active":"true",
    "dst-mac":"ff:ff:ff:ff:ff:ff"
    }

flow_vm =	{
    "priority":"1020",
    "active":"true"
    }


topology=TopologyRequest(controllerAddress)
networks_id_json=topology.get();
for network in networks_id_json:
   for switch in networks_id_json[network]:
        #print networks_id_json[network][switch]['ports_macs']
        i=0
        for ports_macs in networks_id_json[network][switch]['ports_macs']:

            if i == 0: #DHCP data...
                port_id="port_%s" % (instance_num)
                mac_id="mac_%s" % (instance_num)
                dhcp_data[port_id]=ports_macs['port']
                dhcp_data[mac_id]=ports_macs['mac']
                
                

            if i == 1: #VM data
                port_id="port_%s_instance_%s" % (i,instance_num)
                mac_id="mac_%s_instance_%s" % (i,instance_num)
                vm_data[port_id]=ports_macs['port']
                vm_data[mac_id]=ports_macs['mac']
            i+=1

        instance_num+=1

instance_num=1




#Broadcast Flows
for network in networks_id_json:
   for switch in networks_id_json[network]:
        i=1
        port_id_dhcp="port_%s" % (instance_num)
        mac_id_dhcp="mac_%s" % (instance_num)
        port_id="port_%s_instance_%s" % (i,instance_num)
        mac_id="mac_%s_instance_%s" % (i,instance_num)
        
        flow_broadcast_from_vm['name']="broadcast-from-int-vm"
        flow_broadcast_from_vm['switch']=switch
        flow_broadcast_from_vm['src-mac']=vm_data[mac_id]
        flow_broadcast_from_vm['actions']="output=%s,output=%s" % (dhcp_data[port_id_dhcp], inter_island_port)
        
        floodlight_address=networks_id_json[network][switch]['floodlight']
        pusher = StaticFlowPusher(floodlight_address)
        pusher.clear()
        pusher.set(flow_broadcast_from_vm)
        
        flow_broadcast_from_vm['name']="broadcast-from-dhcp"
        flow_broadcast_from_vm['src-mac']=dhcp_data[mac_id_dhcp]
        flow_broadcast_from_vm['actions']="output=%s" % (vm_data[port_id])

        pusher.set(flow_broadcast_from_vm)

        flow_vm['name']="flow-vm-dhcp"
        flow_vm['ingress-port']=vm_data[port_id]
        flow_vm['switch']=switch
        flow_vm['src-mac']=vm_data[mac_id]
        flow_vm['dst-mac']=dhcp_data[mac_id_dhcp]
        flow_vm['actions']="output=%s" % (dhcp_data[port_id_dhcp])

        pusher.set(flow_vm)

        flow_vm['name']="flow-dhcp-vm"
        flow_vm['ingress-port']=dhcp_data[port_id_dhcp]
        flow_vm['src-mac']=dhcp_data[mac_id_dhcp]
        flow_vm['dst-mac']=vm_data[mac_id]
        flow_vm['actions']="output=%s" % (vm_data[port_id])

        pusher.set(flow_vm)

        #Inter Island Flows

        if instance_num==1:
            
            ext_id='mac_1_instance_2'
            flow_broadcast_from_vm['name']="broadcast-from-ext-vm"
            flow_broadcast_from_vm['src-mac']=vm_data[ext_id]
            flow_broadcast_from_vm['actions']="output=%s" % (vm_data[port_id])

            pusher.set(flow_broadcast_from_vm)

            flow_vm['name']="flow-ext-int-vm"
            flow_vm['ingress-port']=inter_island_port
            flow_vm['src-mac']=vm_data[ext_id]
            flow_vm['dst-mac']=vm_data[mac_id]
            flow_vm['actions']="output=%s" % (vm_data[port_id])

            pusher.set(flow_vm)

            flow_vm['name']="flow-int-ext-vm"
            flow_vm['ingress-port']=vm_data[port_id]
            flow_vm['src-mac']=vm_data[mac_id]
            flow_vm['dst-mac']=vm_data[ext_id]
            flow_vm['actions']="output=%s" % (inter_island_port)

            pusher.set(flow_vm)

        if instance_num==2:
            
            ext_id='mac_1_instance_1'
            flow_broadcast_from_vm['name']="broadcast-from-ext-vm"
            flow_broadcast_from_vm['src-mac']=vm_data[ext_id]
            flow_broadcast_from_vm['actions']="output=%s" % (vm_data[port_id])

            pusher.set(flow_broadcast_from_vm)

            flow_vm['name']="flow-ext-int-vm"
            flow_vm['ingress-port']=inter_island_port
            flow_vm['src-mac']=vm_data[ext_id]
            flow_vm['dst-mac']=vm_data[mac_id]
            flow_vm['actions']="output=%s" % (vm_data[port_id])

            pusher.set(flow_vm)

            flow_vm['name']="flow-int-ext-vm"
            flow_vm['ingress-port']=vm_data[port_id]
            flow_vm['src-mac']=vm_data[mac_id]
            flow_vm['dst-mac']=vm_data[ext_id]
            flow_vm['actions']="output=%s" % (inter_island_port)

            pusher.set(flow_vm)

        instance_num+=1

