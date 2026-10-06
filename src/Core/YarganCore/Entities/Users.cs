using YarganCore.Entities.Base;

namespace YarganCore.Entities
{
    public class Users : BaseEntity
    {
        public string UserName { get; set;}
        public string Password { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Surname { get; set; }
        public Guid RoleId { get; set; }
    }
}