using System;
using System.Collections.Generic;
using System.Net;
using System.Text;

namespace YarganCore
{
    public class ApiResponse
    {
        public int Status {  get; set; }
        public string Message { get; set; }
        public object Result { get; set; }

        public ApiResponse(HttpStatusCode status, object result, string message = null)
        {
            Status = (int)status;
            Message = message;
            Result = result;
        }
    }
}
