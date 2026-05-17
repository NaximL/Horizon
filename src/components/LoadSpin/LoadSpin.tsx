import style from "./LoadSpin.module.css"

const LoadSpin = ({ Load, one, size }: { Load: boolean, one?: boolean, size?: number }) => {

    setTimeout(() => {
        const load = document.getElementById('Loadspin')
        if (load) {
            load.classList.add(style.LoadSpinFull);
        }
    }, 300);
    return (
        Load &&
        <>
            {one ?

                <div className={style.ldsRing}>
                    <div></div><div></div><div></div><div></div>
                </div>

                : (
                    <>
                        <div id="Loadspin" className={style.LoadSpinConteiner}>
                            <div className={style.ldsRing}><div></div><div></div><div></div><div></div></div>
                        </div>
                        <div className={style.LoadBack} />
                    </>
                )}
        </>

    );
}

export default LoadSpin;