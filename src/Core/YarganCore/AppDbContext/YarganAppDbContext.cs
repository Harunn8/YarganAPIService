using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using System.Reflection;
using YarganCore.Entities;

namespace YarganCore.AppDbContext
{
    public class YarganAppDbContext : DbContext
    {
        public YarganAppDbContext(DbContextOptions<YarganAppDbContext> options) : base(options) { }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            modelBuilder.Entity<Tle>().OwnsMany(x => x.TleData, builder =>
            {
                builder.ToJson();
            });

            var entityTypes = Assembly.GetExecutingAssembly().GetTypes()
                .Where(x => x.IsClass && !x.IsAbstract && x != typeof(TleData) && x.Namespace == "YarganCore.Entities");

            foreach (var type in entityTypes) modelBuilder.Entity(type);
        }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                string basePath = Directory.GetCurrentDirectory();

                IConfigurationRoot configuration = new ConfigurationBuilder()
                    .SetBasePath(basePath)
                    .AddJsonFile("appsettings.json", optional: true)
                    .AddJsonFile("appsettings.Development.json", optional: true)
                    .Build();

                var connectionString = configuration.GetConnectionString("Postgres");

                optionsBuilder.UseNpgsql(connectionString);
            }
        }
    }
}