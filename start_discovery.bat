@echo off
cd /d C:\Users\Asus\Desktop\NexusCommerce\discovery-service\discovery
mvnw.cmd spring-boot:run -Dspring-boot.run.jvmArguments="-Deureka.server.wait-time-in-ms-when-sync-empty=0"
