using System;
using System.Collections.Generic;
using System.Text;

namespace RuleApplication.Responses
{
    public class PolicyScriptResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string Script { get; set; }
        public DateTime UpdateDate { get; set; }
    }
}
