import { fetchPost } from "../common/web.js";
import { serverUrl } from "../common/def_global.js";
import { DateToString } from "../common/globalFunctions.js";

document.getElementById('refresh-btn').addEventListener('click', RefreshMeetings);
document.getElementById('startMonth').addEventListener('change', RefreshMeetings);
document.getElementById('endMonth').addEventListener('change', RefreshMeetings);
document.getElementById('btn_submit').addEventListener('click', Submit);
Init();
var originData = [];
var changed = [];

async function Init()
{
    document.getElementById('startMonth').value = DateToString(new Date()).substring(0,7);
    document.getElementById('endMonth').value = DateToString(new Date()).substring(0,7);

    document.getElementById('new-btn').addEventListener('click', OpenModal);
    const allModalHeaders = document.querySelectorAll('.modal-header');
    for(var i=0; i<allModalHeaders.length; i++)
        allModalHeaders[i].addEventListener('click', closeModal);

    var content = {
        "method": "init",
        "data": { "Item": "Meetings" }
    }
    var result = await fetchPost(serverUrl + "/api", content, "application/json");
    if(result[0] == 200)
    {
        RefreshMeetings();
    }
}

async function RefreshMeetings()
{
    if(new Date(document.getElementById('startMonth').value).getTime() > new Date(document.getElementById('endMonth').value).getTime())
    {
        const temp = document.getElementById('startMonth').value;
        document.getElementById('startMonth').value = document.getElementById('endMonth').value;
        document.getElementById('endMonth').value = temp;
    }
    var content = {
        "method": "getmeetings",
        "data": {
            "StartMonth": document.getElementById('startMonth').value,
            "EndMonth": document.getElementById('endMonth').value
        }
    };
    var result = await fetchPost(serverUrl + "/api", content, "application/json");
    if(result[0] == 200)
    {
        const meetingBody = document.getElementById('meetings');
        meetingBody.innerHTML = "";
        originData = result[1];
        for(var i=0; i<result[1].length; i++)
        {
            const myTR = document.createElement('tr');
            const tdTime = document.createElement('td');
            tdTime.innerHTML = DateToString(new Date(result[1][i].Time));
            tdTime.id = "mm_time_" + i;
            tdTime.className = "normal";
            tdTime.addEventListener('click', MeetingClicked);
            myTR.appendChild(tdTime);
            
            const tdName = document.createElement('td');
            tdName.innerHTML = result[1][i].Name;
            tdName.id = "mm_name_" + i;
            tdName.className = "normal";
            tdName.addEventListener('click', MeetingClicked);
            myTR.appendChild(tdName);

            const tdPosition = document.createElement('td');
            tdPosition.innerHTML = result[1][i].Position;
            tdPosition.id = "mm_position_" + i;
            tdPosition.className = "normal";
            tdPosition.addEventListener('click', MeetingClicked);
            myTR.appendChild(tdPosition);

            meetingBody.appendChild(myTR);
        }
    }
}

var newID = -1;
var curID = -1;
function MeetingClicked()
{
    curID = parseInt(this.id.split('_')[2]);
    document.getElementById('m_time').value = document.getElementById('mm_time_' + curID).innerHTML;
    document.getElementById('m_name').value = document.getElementById('mm_name_' + curID).innerHTML;
    document.getElementById('m_position').value = document.getElementById('mm_position_' + curID).innerHTML;
    OpenModal();
}

function ShowModifiedMeetings()
{
    if(document.getElementById('m_time').value == '' || document.getElementById('m_name').value == '' || document.getElementById('m_position').value == '')
        return;

    if(curID <= newID)
    {
        const meetingBody = document.getElementById('meetings');

        const myTR = document.createElement('tr');
        const tdTime = document.createElement('td');
        tdTime.innerHTML = DateToString(new Date(document.getElementById('m_time').value));
        tdTime.id = "mm_time_" + newID;
        tdTime.className = "new";
        tdTime.addEventListener('click', MeetingClicked);
        myTR.appendChild(tdTime);
            
        const tdName = document.createElement('td');
        tdName.innerHTML = document.getElementById('m_name').value;
        tdName.id = "mm_name_" + newID;
        tdName.className = "new";
        tdName.addEventListener('click', MeetingClicked);
        myTR.appendChild(tdName);

        const tdPosition = document.createElement('td');
        tdPosition.innerHTML = document.getElementById('m_position').value;
        tdPosition.id = "mm_position_" + newID;
        tdPosition.className = "new";
        tdPosition.addEventListener('click', MeetingClicked);
        myTR.appendChild(tdPosition);

        meetingBody.appendChild(myTR);
        changed[changed.length] = newID;
        
        newID--;
    }
    else
    {
        document.getElementById('mm_time_' + curID).innerHTML = DateToString(new Date(document.getElementById('m_time').value));
        document.getElementById('mm_name_' + curID).innerHTML = document.getElementById('m_name').value;
        document.getElementById('mm_position_' + curID).innerHTML = document.getElementById('m_position').value;

        if(DateToString(new Date(originData[curID].Time)) == document.getElementById('mm_time_' + curID).innerHTML
            && originData[curID].Name == document.getElementById('mm_name_' + curID).innerHTML
            && originData[curID].Position == document.getElementById('mm_position_' + curID).innerHTML)
        {
            document.getElementById('mm_time_' + curID).className = 'normal';
            document.getElementById('mm_name_' + curID).className = 'normal';
            document.getElementById('mm_position_' + curID).className = 'normal';
            if(changed.findIndex(element => element === curID) != -1)
                changed.splice(changed.findIndex(element => element === curID), 1);
        }
        else
        {
            document.getElementById('mm_time_' + curID).className = 'modified';
            document.getElementById('mm_name_' + curID).className = 'modified';
            document.getElementById('mm_position_' + curID).className = 'modified';
            if(changed.findIndex(element => element === curID) == -1)
                changed[changed.length] = curID;
        }
    }
}

function OpenModal()
{
    document.getElementById('modal_modify').style.display = 'block';
}

function closeModal()
{
    ShowModifiedMeetings();
    curID = newID;
    document.getElementById(this.id.replace('md_close', 'modal')).style.display = 'none';
    CleanModal();
}

function CleanModal()
{
    document.getElementById('m_time').value = '';
    document.getElementById('m_name').value = '';
    document.getElementById('m_position').value = '';
}

async function Submit()
{
    if(changed.length == 0)
        return;

    const changedData = [];
    for(var i=0; i<changed.length; i++)
    {
        changedData[changedData.length] = {
            ID: changed[i] > -1 ? originData[changed[i]].ID : "-1",
            Time: document.getElementById('mm_time_' + changed[i]).innerHTML,
            Name: document.getElementById('mm_name_' + changed[i]).innerHTML,
            Position: document.getElementById('mm_position_' + changed[i]).innerHTML
        };
    }
    var content = {
        "method": "submit",
        "data": {
            "changedData": changedData
        }
    };
    await fetchPost(serverUrl + "/api", content, "application/json");

    changed.length = 0;
    RefreshMeetings();
}