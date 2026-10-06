using System;
using System.Collections.Generic;
using System.Text;

namespace UserApplication.Models
{
    public class AddUserModel
    {
        public string UserName { get; set; }
        public string Password { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Surname { get; set; }
        public Guid RoleId { get; set; }
    }
}