var PDtoolevents = {
   "AWS Cloudwatch" : {
      "event" : {
         "client" : "AWS Console",
         "details" : {
            "NewStateReason" : "Threshold Crossed: 1 datapoint (3510.2) was greater than or equal to the threshold (1.0).",
            "AlarmDescription" : "Created from EC2 Console",
            "AlarmName" : "AWS-Disk-Writes",
            "Trigger" : {
               "Threshold" : 1,
               "Namespace" : "AWS/EC2",
               "MetricName" : "NetworkIn",
               "ComparisonOperator" : "GreaterThanOrEqualToThreshold",
               "Dimensions" : [
                  {
                     "name" : "InstanceId",
                     "value" : "i-b7deec04"
                  }
               ],
               "Period" : 300,
               "Unit" : null,
               "Statistic" : "AVERAGE",
               "EvaluationPeriods" : 1
            },
            "NewStateValue" : "ALARM",
            "Region" : "US - N. Virginia",
            "OldStateValue" : "OK",
            "AWSAccountId" : "864672256020",
            "StateChangeTime" : "2016-01-29T20:28:54.744+0000"
         },
         "incident_key" : "AWS-Disk-Writes",
         "event_type" : "trigger",
         "client_url" : "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#c=CloudWatch&s=Alarms&alarm=AWS-Disk-Writes",
         "description" : "Average NetworkIn GreaterThanOrEqualToThreshold 1.0 for InstanceId i-b7deec04"
      }
   },
   "ServiceNow" : {
      "event" : {
         "incident_key" : "8d4950894f5552409e3d7bb28110c7ec",
         "details" : {
            "WorkNote" : "SAN disk degredation require troubleshooting",
            "Priority" : "1 - Critical",
            "AssignmentGroup" : "Hardware"
         },
         "client" : "ServiceNow",
         "description" : "INC0010114:Disk read errors",
         "client_url" : "https://ven01349.service-now.com/incident.do?sys_id=8d4950894f5552409e3d7bb28110c7ec&sysparm_stack=incident_list.do?sysparm_query=active=true",
         "event_type" : "trigger"
      }
   },
   "API Low Trigger" : {
      "event" : {
         "description" : "Rate of DB locks increasing",
         "client_url" : "https://pagerduty.com",
         "event_type" : "trigger",
         "contexts" : [
            {
               "type" : "link",
               "href" : "http://pdt-demo.pagerduty.com"
            },
            {
               "text" : "View the incident on PagerDuty",
               "href" : "http://pdt-demo.pagerduty.com",
               "type" : "link"
            },
            {
               "type" : "image",
               "src" : "https://myc4.files.wordpress.com/2013/10/portfolio-performance-graph-q3-2013.png"
            }
         ],
         "incident_key" : "LockProd1",
         "details" : {
            "Locks" : "58",
            "Rate" : 75
         },
         "client" : "Sample Monitoring Service"
      }
   },
   "DataDog" : {
      "event" : {
         "description" : "Long history length in xdb (possible stuck transaction)",
         "vendor" : "datadog",
         "client" : "Datadog",
         "event_type" : "trigger",
         "contexts" : [
            {
               "src" : "https://p.datadoghq.com/snapshot/view/dd-snapshots-prod/org_1804/2016-01-08/2a82598cc2d67f28542eb218f1094db70657b139.png",
               "href" : "https://appp.datadoghq.com/monitors#72563?to_ts=1452282540000&group=host%3Aprod-web-xdb09&from_ts=1452281340000",
               "alt" : "Snapshot of metric",
               "type" : "image"
            },
            {
               "href" : "https://appp.datadoghq.com/monitors#72563?to_ts=1452282540000&group=host%3Aprod-web-xdb09&from_ts=1452281340000",
               "type" : "link",
               "text" : "Monitor Status"
            },
            {
               "text" : "Triggered Monitors",
               "type" : "link",
               "href" : "https://app.datadoghq.com/monitors/triggered"
            }
         ],
         "client_url" : "https://app.datadoghq.com/monitors#72563?to_ts=1452282540000&group=host%3Aprod-web-xdb09&from_ts=1452281340000",
         "details" : {
            "tags" : "aws-prod, base, env:prod, host:farnsworth, monitor, pd_az:us-west-2c, production, xdb, xtradb",
            "user" : null,
            "priority" : "normal",
            "title" : "Long history length in xdb (possible stuck transaction) on host:farnsworth on {host:farnsworth}",
            "org" : "DiaglogiDevOp",
            "event_type" : "metric_alert_monitor",
            "query" : "avg(last_5m):avg:mysql2.Innodb_history_list_length{role:xdb} by {host} > 12500",
            "body" : "History list length is high, which usually indicates that an active but idle transaction is persisting. Go find the transaction (SHOW ENGINE INNODB STATUS\\G, usually the last one listed) and kill it (KILL <thread id>).  @devop-Datadog mysql2.Innodb_history_list_length over role:xdb was > 12500.0 on average during the last 5m. Metric value: 12796.667",
            "event_id" : "8125363154448140714"
         },
         "incident_key" : "518bc812f69e4f0cbe3369c8bb809639"
      }
   },
   "Website Sample" : {
      "event" : {
         "client_url" : "https://monitoring.service.com",
         "description" : "FAILURE for production/HTTP on machine srv01.acme.com",
         "contexts" : [
            {
               "type" : "link",
               "href" : "http://acme.pagerduty.com"
            },
            {
               "text" : "View the incident on PagerDuty",
               "href" : "http://acme.pagerduty.com",
               "type" : "link"
            },
            {
               "src" : "https://chart.googleapis.com/chart?chs=600x400&chd=t:6,2,9,5,2,5,7,4,8,2,1&cht=lc&chds=a&chxt=y&chm=D,0033FF,0,0,5,1",
               "type" : "image"
            }
         ],
         "event_type" : "trigger",
         "client" : "Sample Monitoring Service",
         "details" : {
            "ping time" : "1500ms",
            "load avg" : 0.75
         }
      }
   },
   "New Relic" : {
      "event" : {
         "description" : "Alert open: Memory > 3% - Server: ip-172-30-0-227 - Policy: Download threshold exceeded",
         "client_url" : "https://rpm.newrelic.com/accounts/1218847/incidents/17615637",
         "event_type" : "trigger",
         "incident_key" : "/Alert/1218847/17615637/13317445",
         "client" : "New Relic",
         "details": {
            "ConfigurationItem": "ACME ENET",
            "AlertMessage": "Email dispatch delay from AM-FLOR-APVM012 server. Delay: 870 secs",
            "CI": "ACME ENET",
            "Priority": "2 - High"
         }
      }
   },
   "Zabbix" : {
      "event" : {
         "incident_key" : "13500-Zabbix server",
         "details" : {
            "status" : "PROBLEM",
            "id" : "13500",
            "severity" : "Warning",
            "name" : "Lack of free swap space on Zabbix server",
            "value" : "1",
            "event_id" : "41",
            "ip" : "127.0.0.1",
            "hostname" : "Zabbix server"
         },
         "agent" : {
            "queued_by" : "pd-zabbix",
            "queued_at" : "2016-01-29T01:43:35Z",
            "agent_id" : "c2f5ce34-be00-484b-be60-d3ac6c66d6f3"
         },
         "description" : "Lack of free swap space on Zabbix server : PROBLEM for Zabbix server",
         "event_type" : "trigger"
      }
   },
   "Nagios" : {
      "event" : {
         "event_type" : "trigger",
         "client_url" : "https://monitoring.service.com",
         "description" : "java.lang.OutOfMemoryError: Java heap space",
         "client" : "My Nagios Instance",
         "details" : {
            "pd_nagios_object" : "service",
            "SERVICEDESC" : "Memory",
            "HOSTNAME" : "prodwest.acme.com",
            "CONTACTPAGER" : "1111111",
            "SERVICEOUTPUT" : "java.lang.OutOfMemoryError: Java heap space",
            "SERVICESTATE" : "WARNING"
         },
         "incident_key" : "NagiosTest"
      }
   },
   "Sensu" : {
      "event" : {
         "event_type" : "trigger",
         "description" : "test/disk : CheckDisk CRITICAL: / 18.2% bytes usage",
         "details" : {
            "client" : {
               "timestamp" : 1454103783,
               "name" : "production",
               "subscriptions" : [
                  "test"
               ],
               "address" : "app04.acme.com",
               "version" : "0.21.0"
            },
            "occurrences" : 180,
            "check" : {
               "history" : [
                  "2",
                  "2",
                  "2",
                  "2",
                  "2",
                  "2",
                  "2"
               ],
               "issued" : 1454103789,
               "executed" : 1454103789,
               "duration" : 0.146,
               "command" : "check-disk-usage.rb -w 1 -c 2",
               "status" : 2,
               "handlers" : [
                  "default",
                  "pagerduty"
               ],
               "name" : "disk",
               "interval" : 10,
               "total_state_change" : 0,
               "output" : "CheckDisk CRITICAL: / 18.2% bytes usage\n",
               "subscribers" : [
                  "test"
               ]
            },
            "timestamp" : 1454103789,
            "id" : "37f18409-aee2-4102-aa71-a9847edb16ed",
            "action" : "create"
         },
         "incident_key" : "test/disk"
      }
   }
};
