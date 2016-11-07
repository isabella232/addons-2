var PDtoolevents = {
	"Website Sample": {    
	  "event_type": "trigger",
	  "description": "FAILURE for production/HTTP on machine srv01.acme.com",
	  "client": "Sample Monitoring Service",
	  "client_url": "https://monitoring.service.com",
	  "details": {
	    "ping time": "1500ms",
	    "load avg": 0.75
	  },
	  "contexts":[ 
	    {
	      "type": "link",
	      "href": "http://acme.pagerduty.com"
	    },{
	      "type": "link",
	      "href": "http://acme.pagerduty.com",
	      "text": "View the incident on PagerDuty"
	    },{
	      "type": "image",
	      "src": "https://chart.googleapis.com/chart?chs=600x400&chd=t:6,2,9,5,2,5,7,4,8,2,1&cht=lc&chds=a&chxt=y&chm=D,0033FF,0,0,5,1"
	    }
	  ]
	},
	
	"DataDog": {
	  "client_url": "https://app.datadoghq.com/monitors#72563?to_ts=1452282540000&group=host%3Aprod-web-xdb09&from_ts=1452281340000",
	  "incident_key": "518bc812f69e4f0cbe3369c8bb809639",
	  "client": "Datadog",
	  "vendor": "datadog",
	  "event_type": "trigger",
	  "contexts": [
	    {
	      "src": "https://p.datadoghq.com/snapshot/view/dd-snapshots-prod/org_1804/2016-01-08/2a82598cc2d67f28542eb218f1094db70657b139.png",
	      "alt": "Snapshot of metric",
	      "href": "https://appp.datadoghq.com/monitors#72563?to_ts=1452282540000&group=host%3Aprod-web-xdb09&from_ts=1452281340000",
	      "type": "image"
	    },
	    {
	      "text": "Monitor Status",
	      "href": "https://appp.datadoghq.com/monitors#72563?to_ts=1452282540000&group=host%3Aprod-web-xdb09&from_ts=1452281340000",
	      "type": "link"
	    },
	    {
	      "text": "Triggered Monitors",
	      "href": "https://app.datadoghq.com/monitors/triggered",
	      "type": "link"
	    }
	  ],
	  "details": {
	    "body": "History list length is high, which usually indicates that an active but idle transaction is persisting. Go find the transaction (SHOW ENGINE INNODB STATUS\\G, usually the last one listed) and kill it (KILL <thread id>).  @devop-Datadog mysql2.Innodb_history_list_length over role:xdb was > 12500.0 on average during the last 5m. Metric value: 12796.667",
	    "priority": "normal",
	    "query": "avg(last_5m):avg:mysql2.Innodb_history_list_length{role:xdb} by {host} > 12500",
	    "event_type": "metric_alert_monitor",
	    "title": "Long history length in xdb (possible stuck transaction) on host:farnsworth on {host:farnsworth}",
	    "event_id": "8125363154448140714",
	    "org": "DiaglogiDevOp",
	    "tags": "aws-prod, base, env:prod, host:farnsworth, monitor, pd_az:us-west-2c, production, xdb, xtradb",
	    "user": null
	  },
	  "description": "Long history length in xdb (possible stuck transaction)"
	},
	
	"New Relic": {    
	  "event_type": "trigger",
	  "incident_key": "/Alert/1218847/17615637/13317445",
	  "description": "Alert open: Memory > 3% - Server: ip-172-30-0-227 - Policy: Download threshold exceeded",
	  "client": "New Relic",
	  "client_url": "https://rpm.newrelic.com/accounts/1218847/incidents/17615637"
	      
	},
	
	"ServiceNow": {
	  "client": "ServiceNow",
	  "client_url": "https://ven01349.service-now.com/incident.do?sys_id=8d4950894f5552409e3d7bb28110c7ec&sysparm_stack=incident_list.do?sysparm_query=active=true",
	  "description": "INC0010114:Disk read errors",
	  "details": {
	    "AssignmentGroup": "Hardware",
	    "Priority": "1 - Critical",
	    "WorkNote": "SAN disk degredation require troubleshooting"
	  },
	  "event_type": "trigger",
	  "incident_key": "8d4950894f5552409e3d7bb28110c7ec"
	},
	
	"Zabbix": {
	  "agent": {
	    "agent_id": "c2f5ce34-be00-484b-be60-d3ac6c66d6f3",
	    "queued_at": "2016-01-29T01:43:35Z",
	    "queued_by": "pd-zabbix"
	  },
	  "description": "Lack of free swap space on Zabbix server : PROBLEM for Zabbix server",
	  "details": {
	    "event_id": "41",
	    "hostname": "Zabbix server",
	    "id": "13500",
	    "ip": "127.0.0.1",
	    "name": "Lack of free swap space on Zabbix server",
	    "severity": "Warning",
	    "status": "PROBLEM",
	    "value": "1"
	  },
	  "event_type": "trigger",
	  "incident_key": "13500-Zabbix server"
	},
	
	"Sensu": {
		"incident_key": "test/disk",
		"description": "test/disk : CheckDisk CRITICAL: / 18.2% bytes usage",
		"details": {
		"id": "37f18409-aee2-4102-aa71-a9847edb16ed",
		"client": {
		  "name": "production",
		  "address": "localhost",
		  "subscriptions": [
		    "test"
		  ],
		  "version": "0.21.0",
		  "timestamp": 1454103783
		},
		"check": {
		  "handlers": [
		    "default",
		    "pagerduty"
		  ],
		  "command": "check-disk-usage.rb -w 1 -c 2",
		  "interval": 10,
		  "subscribers": [
		    "test"
		  ],
		  "name": "disk",
		  "issued": 1454103789,
		  "executed": 1454103789,
		  "duration": 0.146,
		  "output": "CheckDisk CRITICAL: / 18.2% bytes usage\n",
		  "status": 2,
		  "history": [
		    "2",
		    "2",
		    "2",
		    "2",
		    "2",
		    "2",
		    "2"
		  ],
		  "total_state_change": 0
		},
		"occurrences": 180,
		"action": "create",
		"timestamp": 1454103789
		},
		"event_type": "trigger"
	},
	
	"AWS Cloudwatch": {
	  "event_type": "trigger",
	  "description": "Average NetworkIn GreaterThanOrEqualToThreshold 1.0 for InstanceId i-b7deec04",
	  "incident_key": "AWS-Disk-Writes",
	  "client": "AWS Console",
	  "client_url": "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#c=CloudWatch&s=Alarms&alarm=AWS-Disk-Writes",
	  "details": {"AlarmName":"AWS-Disk-Writes","AlarmDescription":"Created from EC2 Console","AWSAccountId":"864672256020","NewStateValue":"ALARM","NewStateReason":"Threshold Crossed: 1 datapoint (3510.2) was greater than or equal to the threshold (1.0).","StateChangeTime":"2016-01-29T20:28:54.744+0000","Region":"US - N. Virginia","OldStateValue":"OK","Trigger":{"MetricName":"NetworkIn","Namespace":"AWS/EC2","Statistic":"AVERAGE","Unit":null,"Dimensions":[{"name":"InstanceId","value":"i-b7deec04"}],"Period":300,"EvaluationPeriods":1,"ComparisonOperator":"GreaterThanOrEqualToThreshold","Threshold":1}}
	},
	
	"API Low Trigger": {    
      "incident_key": "LockProd1",
      "event_type": "trigger",
      "description": "Rate of DB locks increasing",
      "client": "Sample Monitoring Service",
      "client_url": "https://pagerduty.com",
      "details": {
        "Locks": "58",
        "Rate": 75
      },
      "contexts":[ 
        {
          "type": "link",
          "href": "http://pdt-demo.pagerduty.com"
        },{
          "type": "link",
          "href": "http://pdt-demo.pagerduty.com",
          "text": "View the incident on PagerDuty"
        },{
          "type": "image",
          "src": "https://myc4.files.wordpress.com/2013/10/portfolio-performance-graph-q3-2013.png"
        }
      ]
    },
    "Nagios": {    
      "incident_key": "NagiosTest",
      "event_type": "trigger",
      "description": "java.lang.OutOfMemoryError: Java heap space",
      "client": "My Nagios Instance",
      "client_url": "https://monitoring.service.com",
      "details":  
        {
          "HOSTNAME": "prodWest",
          "SERVICEDESC": "Memory",
          "SERVICEOUTPUT": "java.lang.OutOfMemoryError: Java heap space",
          "SERVICESTATE": "WARNING",
          "pd_nagios_object": "service",
          "CONTACTPAGER": "1111111"
        }
      
    }
};
