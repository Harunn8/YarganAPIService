# Rule/Satops Dockerfile'larıyla aynı kalıp. Build context: repo kökü.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/Login/LoginAPI/LoginAPI.csproj", "src/Login/LoginAPI/"]
COPY ["src/Login/LoginApplication/LoginApplication.csproj", "src/Login/LoginApplication/"]
COPY ["src/Common/Helper/Helpers/Helpers.csproj", "src/Common/Helper/Helpers/"]
RUN dotnet restore "./src/Login/LoginAPI/LoginAPI.csproj"
COPY . .
WORKDIR "/src/src/Login/LoginAPI"
RUN dotnet build "./LoginAPI.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./LoginAPI.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "LoginAPI.dll"]
