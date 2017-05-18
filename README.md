# API-Manager
API Manager tools and themes

# WSO2

## Requirements

- AAC
- MySQL 5.5+

## Setup

### 1. Database setup

- using mysql as DB:

		- mysql -u root -p
		
		- create database regdb character set latin1 (*);
		 
		- GRANT ALL ON regdb.* TO regadmin@localhost IDENTIFIED BY "regadmin";
		
		- FLUSH PRIVILEGES;
		 
		- quit;

(*) character set is for windows only

- copy mysql connector (i.e. mysql-connector-java-*-bin.jar) into *repository/components/lib*
	
 
- edit /repository/conf/datasources/master-datasources.xml
	 
	- for the datasources **WSO2_CARBON_DB** and **WSO2AM_DB**, make these changes:
	
			<url>jdbc:mysql://localhost:3306/regdb</url>
            <username>regadmin</username>
            <password>regadmin</password>
            <driverClassName>com.mysql.jdbc.Driver</driverClassName> 

	- launch the following scripts (for MySQL 5.7 use versions *.5.7.sql)
	 
			mysql -u regadmin -p -Dregdb < dbscripts/mysql.sql
			mysql -u regadmin -p -Dregdb < dbscripts/apimgt/mysql.sql

### 2. WSO2 Configuration

Clone API Manager project

**2.1. WSO2-AAC connector**

- build **wso2aac.client** project with Maven.

- copy *wso2aac.client-1.0.jar* from the project *API-Manager/wso2aac.client* to the WSO2 directory *repository/components/lib*

**2.2. WSO2 configurations**

- in *repository/conf/api-manager.xml*, change APIKeyManager and set **ConsumerSecret** with the value found in AAC for the client with clientId API_MGT_CLIENT_ID

    	<APIKeyManager>
    		<KeyManagerClientImpl>it.smartcommunitylab.wso2aac.keymanager.AACOAuthClient</KeyManagerClientImpl>
    		<Configuration>
    			<RegistrationEndpoint>http://localhost:8080/aac</RegistrationEndpoint>
    			<ConsumerKey>API_MGT_CLIENT_ID</ConsumerKey>
    			<ConsumerSecret></ConsumerSecret>
    			<Username>admin</Username>
    			<Password>admin</Password>
    			<VALIDITY_PERIOD>3600</VALIDITY_PERIOD>
    			<ServerURL>https://localhost:9443/services/</ServerURL>
    			<RevokeURL>https://localhost:8243/revoke</RevokeURL>
    			<TokenURL>http://localhost:8080/aac/oauth/token</TokenURL>			
    		</Configuration>
    	</APIKeyManager>

- in *repository/conf/api-manager.xml*, uncomment **RemoveOAuthHeadersFromOutMessage** and set it to false

	`<RemoveOAuthHeadersFromOutMessage>false</RemoveOAuthHeadersFromOutMessage>`


- in *repository/conf/identity/identity.xml* change


   `<OAuthScopeValidator class="org.wso2.carbon.identity.oauth2.validators.JDBCScopeValidator"/>`

to

   `<OAuthScopeValidator class="it.smartcommunitylab.wso2aac.keymanager.CustomJDBCScopeValidator"/>`

- in *repository/conf/carbon.xml*, enable email username

	`<EnableEmailUserName>true</EnableEmailUserName>`

- in *repository/conf/user-mgt.xml*, add the following property to `<UserStoreManager>`

	`<Property name="UsernameWithEmailJavaScriptRegEx">^[\S]{3,30}$</Property>`

**2.3. WSO2 Theming**

- copy the contents of project *API-Manager/wso2.custom* into the WSO2 directory

### 3. Keystore configuration

Import and add WSO2 certificate to the default keystore.

``sudo rm -f cert.pem && sudo echo -n | openssl s_client -connect localhost:9443 | sed -ne '/-BEGIN CERTIFICATE-/,/-END CERTIFICATE-/p' > ./cert.pem``

``sudo keytool -import -trustcacerts -file cert.pem -alias root -keystore JAVA_HOME/jre/lib/security/cacerts``
	

### 4. Proxy server configuration (Apache)

**4.1. Configure proxy for apps **

- Configure proxy publisher and subscriber apps: repository/deployment/server/jaggeryapps/publisher/site/conf/site.json (same for store):
  - context: /publisher
  - host: < mydomain.com >, e.g., am-dev.smartcommunitylab.it
- Configure management console: repository/conf/carbon.xml
  - ``<HostName>am-dev.smartcommunitylab.it</HostName>``
  - ``<MgtHostName>am-dev.smartcommunitylab.it</MgtHostName>``
- Configure WSO2 Tomcat reverse proxy: repository/conf/tomcat/catalina-server.xml
  - Add parameters to 9443 connector:
    ```
    proxyPort="443"
    proxyName="am-dev.smartcommunitylab.it"
    ```
  - Configure Apache Virtual Host:
    - port 80: redirect port 80 to 443
    - port 443: ProxtPath and ProxyPathReverse / to ip:9443/
    
**4.2. API Gateway** 
 - Configure Gateway endpoint: repository/conf/api-manager.xml
   ```
   <GatewayEndpoint>http://api-dev.smartcommunitylab.it,https://api-dev.smartcommunitylab.it</GatewayEndpoint>
   ```
 - Configure axis2 transport Ins (http and https): add the following parameters
   ```
   <parameter name="proxyPort" locked="false">80</parameter>
   <parameter name="hostname" locked="false">api-dev.smartcommunitylab.it</parameter>
   ```
  - Configure Apache Virtual Host:
    - port 80: ProxtPath and ProxyPathReverse / to ip:8280/
    - port 443: ProxtPath and ProxyPathReverse / to ip:8243/
     