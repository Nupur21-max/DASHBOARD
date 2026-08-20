const base_url='https://dashboard-2xnz.onrender.com'

// display date picker
function datePick(){
    const picker = document.getElementById("date_picker");
    return picker.value; // format: YYYY-MM-DD, matches input[type=date]
}

function renderKpiCards(kpiCards){
    const todaySales=kpiCards.todaysales
    const todayRevenue=kpiCards.todayrevenue
    const salesLastMonth=kpiCards.saleslastmonth
    const revLastMonth=kpiCards.revenuelastmonth
    const salesPvThisDay=kpiCards.salespvthisday
    const revPvThisDay=kpiCards.revenuepvthisday
    const salesThisMonth=kpiCards.salesthismonth
    const revThisMonth=kpiCards.revenuethismonth
    
    document.getElementById("today").textContent=` ${todaySales} orders
    ₹ ${todayRevenue} Revenue` 
    document.getElementById("thisMonth").textContent=`${salesThisMonth} orders
    ₹ ${revThisMonth} Revenue`
    document.getElementById("prevMonthSameDay").textContent=`${salesPvThisDay} orders
    ₹ ${revPvThisDay} Revenue`
    document.getElementById("prevMonth").textContent=`${salesLastMonth} orders
    ₹ ${revLastMonth} Revenue`
}

function renderDailyLeaderboard(leaderboard){
    const tableBody = document.querySelector("#metrics-table tbody");
    // Helper 'function' to turn null values into dashes or 0
    const formatValue = (val) => val === null ? "-" : val;
    const formatCurrency = (val) => val === null ? "-" : "₹" + val.toLocaleString();
      
    // make rows
    leaderboard.forEach(element => {
        const row=document.createElement("tr");
        row.innerHTML =`
        <td><strong>${element.sales_rep.trim()}</strong></td>
        <td>${formatValue(element.tdy_sales)}</td>
        <td>${formatCurrency(element.tdy_revenue)}</td>
        <td>${formatValue(element.mtd_sales)}</td>
        <td>${formatCurrency(element.mtd_revenue)}</td>
      `;
      // append them to table
        tableBody.appendChild(row);
    });
}

function renderDayWiseGraph(dayWiseGraph){
    const container1=document.getElementById("daywiseRev");
    const ctx1=container1.getContext('2d')
    const container2=document.getElementById("daywiseSale");
    const ctx2=container2.getContext('2d')

    // prepare data
    const dates=[]
    const revenue=[]
    const sales=[]
    dayWiseGraph.forEach(element=>{
        dates.push(element.order_date);
        revenue.push(element.total_revenue);
        sales.push(element.no_of_sales);
    });

    // make revenue chart
    const dayRevChart=new Chart(ctx1,{
        type : 'line' ,
        data : {
            labels:dates, // x axis values, shared across both lines
            datasets:[
                // line 2:revenue
                {
                    label:'Revenue Generated',
                    data:revenue,
                    borderColor: '#2ecc71', // Green line
                    backgroundColor: 'rgba(46, 204, 113, 0.1)',
                    tension: 0.2,
                    yAxisID: 'y'         // <-- added
                }
            ]
        },
        options:{
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    title: { display: true, text: 'Revenue (₹)' },
                    grid: { drawOnChartArea: false }
                }
            }
        }
    });

    //make sales chart
    const daySaleChart=new Chart(ctx2,{
        type : 'line' ,
        data : {
            labels:dates, // x axis values, shared across both lines
            datasets:[
                // line 1: sales
                {
                    label:'Orders received',
                    data:sales,
                    borderColor: '#e74c3c', // Red line
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.2,
                    yAxisID: 'y'         // <-- added

                }
            ]
        },
        options:{
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false
            },
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                    beginAtZero: true,
                    title: { display: true, text: 'Orders' }
                }
            }
        }
    });
}

function renderMonthWiseGraph(monthWiseMetrics){
    const container=document.getElementById("monthwise");
    const ctx=container.getContext('2d')

    // prepare data
    const months=[]
    const sales=[]
    const monthList=['Jan','Feb','March','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

    // guarantee chronological order regardless of API order
    const sortedMetrics = [...monthWiseMetrics].sort((a, b) => {
        return a.year - b.year || a.month - b.month;
    });

    sortedMetrics.forEach(element=>{
        const monthName = monthList[element.month - 1]; 
        const formattedMonth=`${monthName} ${element.year}`
        months.push(formattedMonth)
        sales.push(element.no_of_sales);
    });

    // make chart
    // 2 lines(sales, revenue) on 1 line chart
    const dayChart=new Chart(ctx,{
        type : 'line' ,
        data : {
            labels:months, // x axis values, shared across both lines
            datasets:[
                // line 1: sales
                {
                    label:'Orders received',
                    data:sales,
                    borderColor: '#e74c3c', // Red line
                    backgroundColor: 'rgba(231, 76, 60, 0.1)',
                    tension: 0.2

                }
            ]
        },
        options:{
             responsive: true,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
        }
        }
    )


}

async function getDashboard() {
    const reportDate = datePick();
    
    try {
        const response = await fetch(`${base_url}/get_data/${reportDate}`);
        
        if (!response.ok) {
            throw new Error(`HTTP network error status code: ${response.status}`);
        }

        const rawdata = await response.json();
        const targetData=rawdata[0] // supabase is returning [{{},{}}] not {{{}},{}} so we need to get the javascript obj first
        const kpiCards = targetData.kpi_metrics[0]; //kpi cards also has array of objects not the kpi object directly
        const leaderboard = targetData.sales_rep_metrics;
        const dayWiseGraph = targetData.daily_metrics;
        const monthWiseMetrics = targetData.month_metrics;

        renderKpiCards(kpiCards);
        renderDailyLeaderboard(leaderboard);
        renderDayWiseGraph(dayWiseGraph);
        renderMonthWiseGraph(monthWiseMetrics);
        
    } catch (error) {
        console.error("Dashboard engine rendering failure:", error);
    }
}

// Date picker: button opens the native calendar; input stays hidden
const dateBtn = document.getElementById('date_btn');
const datePicker = document.getElementById('date_picker');

// default to today, but clamp inside the allowed range
const minDate = "2026-01-01";
const maxDate = "2026-05-31";
const today = new Date().toISOString().split('T')[0];
datePicker.value = today > maxDate ? maxDate : (today < minDate ? minDate : today);
dateBtn.textContent = datePicker.value;

dateBtn.addEventListener('click', function() {
    if (typeof datePicker.showPicker === 'function') {
        datePicker.showPicker(); // Chrome/Edge/Opera
    } else {
        datePicker.focus();
        datePicker.click(); // fallback for Firefox/Safari
    }
});

datePicker.addEventListener('change', function() {
    dateBtn.textContent = datePicker.value;
    console.log("Date changed:", datePicker.value);
    getDashboard();
});

// initial load
getDashboard();
