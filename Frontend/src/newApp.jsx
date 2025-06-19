import React from "react";
import { useSelector } from "react-redux";
import Loader from "./Components/Loader"
import ResultComponent from "./Components/ResultComponent";


function NewApp() {

    const loading = useSelector((state) => state.search.loading);

    return (
<div>
                        {loading ? (<Loader />) : 
                            // Your actual search result UI is here
                            (<ResultComponent/>)}
                </div>)}

export default NewApp;

