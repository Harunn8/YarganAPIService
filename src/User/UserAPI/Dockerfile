# Rule/Satops Dockerfile'larıyla aynı kalıp. Build context: repo kökü.
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/User/UserAPI/UserAPI.csproj", "src/User/UserAPI/"]
COPY ["src/User/UserApplication/UserApplication.csproj", "src/User/UserApplication/"]
COPY ["src/Common/Helper/Helpers/Helpers.csproj", "src/Common/Helper/Helpers/"]
COPY ["src/Core/YarganCore/YarganCore.csproj", "src/Core/YarganCore/"]
COPY ["src/MessageBrokers/EventBusBrokers/EventBusBrokers.csproj", "src/MessageBrokers/EventBusBrokers/"]
RUN dotnet restore "./src/User/UserAPI/UserAPI.csproj"
COPY . .
WORKDIR "/src/src/User/UserAPI"
RUN dotnet build "./UserAPI.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./UserAPI.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "UserAPI.dll"]
