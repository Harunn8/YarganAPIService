# Rule/Satops Dockerfile'larıyla aynı kalıp. Build context: repo kökü.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/Device/DeviceAPI/DeviceAPI.csproj", "src/Device/DeviceAPI/"]
COPY ["src/Device/DeviceApplication/DeviceApplication.csproj", "src/Device/DeviceApplication/"]
COPY ["src/Common/Helper/Helpers/Helpers.csproj", "src/Common/Helper/Helpers/"]
COPY ["src/Core/YarganCore/YarganCore.csproj", "src/Core/YarganCore/"]
COPY ["src/MessageBrokers/EventBusBrokers/EventBusBrokers.csproj", "src/MessageBrokers/EventBusBrokers/"]
RUN dotnet restore "./src/Device/DeviceAPI/DeviceAPI.csproj"
COPY . .
WORKDIR "/src/src/Device/DeviceAPI"
RUN dotnet build "./DeviceAPI.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./DeviceAPI.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "DeviceAPI.dll"]
