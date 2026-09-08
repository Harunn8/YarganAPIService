namespace Helpers.UserLogService.Model
{
    public class UserLogs
    {
        public string Description { get; set; }
        public string MethodName { get; set; }
        public DateTime TimeStamp { get; set; }
        public string UserName { get; set; }
        public string AppName { get; set; }
        public LogType LogType {  get; set; }
    }

    public enum LogType
    {
        Add,
        Update,
        Login,
        Delete,
        SendCommand,
        StartCommunication,
        StopCommunication,
        LogOut
    }
}