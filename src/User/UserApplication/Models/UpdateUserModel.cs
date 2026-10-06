namespace UserApplication.Models
{
    public class UpdateUserModel
    {
        public Guid Id { get; set; }
        public string UserName { get; set; }
        public string Password { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Surname { get; set; }
        public Guid RoleId { get; set; }
    }
}